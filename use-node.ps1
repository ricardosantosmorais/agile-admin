$nodeDir = Join-Path $PSScriptRoot '.tooling\node-v22.22.1-win-x64'

if (Test-Path $nodeDir) {
  if (($env:Path -split ';') -notcontains $nodeDir) {
    $env:Path = $nodeDir + ';' + $env:Path
  }

  Write-Host "Node carregado de: $nodeDir"
  & (Join-Path $nodeDir 'node.exe') -v
  & (Join-Path $nodeDir 'npm.cmd') -v
} else {
  Write-Error "Node local não encontrado em $nodeDir"
}
