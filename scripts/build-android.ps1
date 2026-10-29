param([string]$ToolsRoot = '',[switch]$QA)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
if(!$ToolsRoot){$ToolsRoot=Join-Path (Split-Path $projectRoot -Parent) '.build-tools'}
$jdk=(Get-ChildItem -LiteralPath (Join-Path $ToolsRoot 'jdk') -Directory | Select-Object -First 1).FullName
$buildTools=(Get-ChildItem -LiteralPath (Join-Path $ToolsRoot 'build-tools') -Directory | Select-Object -First 1).FullName
$platform=(Get-ChildItem -LiteralPath (Join-Path $ToolsRoot 'platform') -Directory | Select-Object -First 1).FullName
$java=Join-Path $jdk 'bin/java.exe';$javac=Join-Path $jdk 'bin/javac.exe';$jar=Join-Path $platform 'android.jar'
foreach($tool in @($java,$javac,$jar)){if(!(Test-Path -LiteralPath $tool)){throw "Missing Android toolchain. Run scripts/bootstrap-android.py first."}}
$work=Join-Path ([IO.Path]::GetTempPath()) ('neon-cut-build-'+[guid]::NewGuid().ToString('N'));$assets=Join-Path $work 'assets/game';$classes=Join-Path $work 'classes';$dex=Join-Path $work 'dex';$out=Join-Path $projectRoot 'output/android';$private=Join-Path $projectRoot 'private'
New-Item -ItemType Directory -Force $assets,$classes,$dex,$out,$private | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'index.html') -Destination $assets -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'src') -Destination $assets -Recurse -Force
$assetManifest=Get-Content -LiteralPath (Join-Path $projectRoot 'assets-manifest.json') -Raw | ConvertFrom-Json
foreach($relative in $assetManifest.files){
 $source=[IO.Path]::GetFullPath((Join-Path $projectRoot $relative));if(!$source.StartsWith($projectRoot+[IO.Path]::DirectorySeparatorChar)){throw 'Invalid asset manifest path'}
 $target=Join-Path $assets $relative;New-Item -ItemType Directory -Force (Split-Path $target -Parent) | Out-Null;Copy-Item -LiteralPath $source -Destination $target -Force
}
function Run([string]$Exe,[string[]]$ToolArgs){& $Exe @ToolArgs;if($LASTEXITCODE -ne 0){throw "Android build failed: $Exe"}}
Copy-Item -LiteralPath (Join-Path $projectRoot 'android/res') -Destination $work -Recurse
Copy-Item -LiteralPath (Join-Path $projectRoot 'android/AndroidManifest.xml') -Destination $work
if($QA){$manifestPath=Join-Path $work 'AndroidManifest.xml';$qaManifest=(Get-Content -LiteralPath $manifestPath -Raw).Replace('android:debuggable="false"','android:debuggable="true"');[IO.File]::WriteAllText($manifestPath,$qaManifest,[Text.UTF8Encoding]::new($false))}
Copy-Item -LiteralPath $jar -Destination (Join-Path $work 'android.jar');$jar=Join-Path $work 'android.jar'
Run (Join-Path $buildTools 'aapt2.exe') @('compile','--dir',(Join-Path $work 'res'),'-o',(Join-Path $work 'resources.zip'))
Run (Join-Path $buildTools 'aapt2.exe') @('link','-o',(Join-Path $work 'unsigned.apk'),'--manifest',(Join-Path $work 'AndroidManifest.xml'),'-I',$jar,'-A',(Join-Path $work 'assets'),'--auto-add-overlay',(Join-Path $work 'resources.zip'))
Copy-Item -LiteralPath (Join-Path $projectRoot 'android/src') -Destination $work -Recurse
$sources=(Get-ChildItem -LiteralPath (Join-Path $work 'src') -Recurse -Filter '*.java').FullName
Run $javac (@('-J-Duser.language=en','-encoding','UTF-8','-Xlint:-options','--release','8','-classpath',$jar,'-d',$classes)+$sources)
$classFiles=(Get-ChildItem -LiteralPath $classes -Recurse -Filter '*.class').FullName
Run $java (@('-cp',(Join-Path $buildTools 'lib/d8.jar'),'com.android.tools.r8.D8','--lib',$jar,'--min-api','26','--output',$dex)+$classFiles)
Push-Location $dex
try{Run (Join-Path $buildTools 'aapt.exe') @('add','-f',(Join-Path $work 'unsigned.apk'),'classes.dex')}finally{Pop-Location}
Run 'python' @((Join-Path $PSScriptRoot 'normalize-apk.py'),(Join-Path $work 'unsigned.apk'),(Join-Path $work 'normalized.apk'))
Run (Join-Path $buildTools 'zipalign.exe') @('-f','-p','4',(Join-Path $work 'normalized.apk'),(Join-Path $work 'aligned.apk'))
$credentials=Join-Path $private 'signing.json';$keystore=Join-Path $private 'neon-release.p12'
if(!(Test-Path -LiteralPath $credentials)){
  $bytes=[byte[]]::new(32);[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  @{password=[Convert]::ToBase64String($bytes)} | ConvertTo-Json | Set-Content -LiteralPath $credentials -Encoding utf8
}
$env:NEON_STOREPASS=(Get-Content -LiteralPath $credentials -Raw | ConvertFrom-Json).password
try{
 if(!(Test-Path -LiteralPath $keystore)){Run (Join-Path $jdk 'bin/keytool.exe') @('-genkeypair','-keystore',$keystore,'-storetype','PKCS12','-alias','neoncut','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Neon Cut Local Release','-storepass:env','NEON_STOREPASS')}
 $apk=Join-Path $work $(if($QA){'neon-cut-0.4.1-qa.apk'}else{'neon-cut-0.4.1.apk'})
 Run $java @('-jar',(Join-Path $buildTools 'lib/apksigner.jar'),'sign','--ks',$keystore,'--ks-key-alias','neoncut','--ks-pass','env:NEON_STOREPASS','--out',$apk,(Join-Path $work 'aligned.apk'))
 Run $java @('-jar',(Join-Path $buildTools 'lib/apksigner.jar'),'verify','--verbose','--print-certs',$apk)
 Run (Join-Path $buildTools 'aapt.exe') @('dump','badging',$apk)
 Copy-Item -LiteralPath $apk -Destination $out -Force
 Get-FileHash -LiteralPath $apk -Algorithm SHA256 | Format-List
}finally{Remove-Item Env:NEON_STOREPASS -ErrorAction SilentlyContinue}
