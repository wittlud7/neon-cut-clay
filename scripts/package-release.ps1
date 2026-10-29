$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$stage=Join-Path ([IO.Path]::GetTempPath()) ('neon-cut-source-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force $stage | Out-Null
foreach($name in @('index.html','game.js','game.json','project.config.json','package.json','server.js','README.md','RELEASE.md','assets-manifest.json','src','assets','scripts','tests','store','tools')){
  Copy-Item -LiteralPath (Join-Path $projectRoot $name) -Destination $stage -Recurse
}
New-Item -ItemType Directory -Force (Join-Path $stage 'android') | Out-Null
foreach($name in @('AndroidManifest.xml','res','src')){Copy-Item -LiteralPath (Join-Path $projectRoot ('android/'+$name)) -Destination (Join-Path $stage 'android') -Recurse}
$out=Join-Path $projectRoot 'output/release';New-Item -ItemType Directory -Force $out | Out-Null
$zip=Join-Path $out 'neon-cut-0.4.1-source.zip'
Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath $stage).FullName -DestinationPath $zip -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'output/android/neon-cut-0.4.1.apk') -Destination $out -Force
Get-ChildItem -LiteralPath $out -File | Where-Object Extension -in @('.apk','.zip') | Get-FileHash -Algorithm SHA256 | Format-Table -AutoSize
