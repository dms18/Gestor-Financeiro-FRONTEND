<#
.SYNOPSIS
  Gera o APK debug do app (configuração "mobile": API por HTTPS em financasmei.app.br).

.EXAMPLE
  .\scripts\gerar-apk.ps1 -BaixarJdk -Destino C:\TCC\deploy\GestorFinanceiro-debug.apk

.NOTES
  O Gradle 7.4 do projeto só roda até o JDK 17. -BaixarJdk baixa o Temurin 17 para %TEMP%\jdk17-gestor
  (nada é instalado no sistema). Se já tem um JDK 17, use -JdkHome "<pasta>" ou a variável JDK17_HOME.
  Com -Destino, o APK anterior é guardado como <nome>.anterior.apk.
#>
param(
  [string]$Destino,
  [string]$JdkHome = $env:JDK17_HOME,
  [switch]$BaixarJdk
)

$ErrorActionPreference = 'Continue'   # programas nativos escrevem em stderr; cada passo confere $LASTEXITCODE
$front = Split-Path -Parent $PSScriptRoot

# 1) JDK 17
if (-not $JdkHome) {
  $JdkHome = Join-Path $env:TEMP 'jdk17-gestor'
  if (-not (Test-Path "$JdkHome\bin\java.exe")) {
    if (-not $BaixarJdk) { throw 'Informe -JdkHome, defina JDK17_HOME ou use -BaixarJdk.' }
    Write-Output '== baixando Temurin 17'
    $zip = Join-Path $env:TEMP 'jdk17.zip'
    Invoke-WebRequest -UseBasicParsing 'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse' -OutFile $zip
    $tmp = Join-Path $env:TEMP 'jdk17-extract'
    if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
    Expand-Archive $zip $tmp
    $interno = Get-ChildItem $tmp -Directory | Select-Object -First 1
    Move-Item $interno.FullName $JdkHome
    Remove-Item $zip, $tmp -Recurse -Force
  }
}
& "$JdkHome\bin\java.exe" -version

# 2) Bundle Angular em modo mobile (webpack 4 precisa do provider legado no Node recente)
Set-Location $front
Write-Output '== ng build --configuration mobile'
$env:NODE_OPTIONS = '--openssl-legacy-provider'
npx ng build --configuration mobile
if ($LASTEXITCODE -ne 0) { throw 'ng build falhou' }
Remove-Item Env:NODE_OPTIONS

# 3) Sincronizar com o Android e compilar
Write-Output '== cap sync'
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw 'cap sync falhou' }
$env:JAVA_HOME = $JdkHome
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
Set-Location "$front\android"
Write-Output '== gradle assembleDebug'
.\gradlew.bat assembleDebug --console=plain
if ($LASTEXITCODE -ne 0) { throw 'gradle falhou' }

# 4) Copiar o resultado, guardando o anterior
$apk = "$front\android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apk)) { throw "APK não encontrado: $apk" }
if ($Destino) {
  if (Test-Path $Destino) { Copy-Item $Destino ($Destino -replace '\.apk$', '.anterior.apk') -Force }
  Copy-Item $apk $Destino -Force
  Write-Output "APK copiado para $Destino"
} else {
  Write-Output "APK em $apk"
}
