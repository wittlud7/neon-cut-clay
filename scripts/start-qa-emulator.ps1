$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$sdk=(Resolve-Path (Join-Path (Split-Path $projectRoot -Parent) '.build-tools/sdk')).Path
$sdkAlias=Join-Path ([IO.Path]::GetTempPath()) 'NeonCutSdkV4'
if(!(Get-Item -LiteralPath $sdkAlias -Force -ErrorAction SilentlyContinue)){New-Item -ItemType Junction -Path $sdkAlias -Target $sdk | Out-Null}
$avdHome=Join-Path ([IO.Path]::GetTempPath()) 'NeonCutToyAvd'
$avd=Join-Path $avdHome 'NeonCutToyQA.avd';New-Item -ItemType Directory -Force $avdHome,$avd | Out-Null
@('avd.ini.encoding=UTF-8',('path='+$avd),'target=android-30') | Set-Content (Join-Path $avdHome 'NeonCutToyQA.ini') -Encoding ascii
@('AvdId=NeonCutToyQA','avd.ini.displayname=Neon Cut Toy QA','hw.cpu.arch=x86_64','hw.cpu.ncore=2','hw.ramSize=2048','hw.lcd.width=720','hw.lcd.height=1280','hw.lcd.density=320','hw.keyboard=yes','hw.gpu.enabled=yes','hw.gpu.mode=swiftshader','hw.camera.back=none','hw.camera.front=none','hw.audioInput=no','disk.dataPartition.size=2G','fastboot.forceColdBoot=yes',('image.sysdir.1='+(Join-Path $sdkAlias 'system-images/android-30/default/x86_64')),'tag.id=default','tag.display=Default','abi.type=x86_64') | Set-Content (Join-Path $avd 'config.ini') -Encoding ascii
$env:ANDROID_AVD_HOME=$avdHome;$env:ANDROID_SDK_ROOT=$sdkAlias;$env:ANDROID_HOME=$sdkAlias
& (Join-Path $sdkAlias 'emulator/emulator.exe') -avd NeonCutToyQA -no-window -no-audio -no-metrics -no-boot-anim -no-snapshot -gpu swiftshader -port 5580 -memory 2048
