$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($nodeCommand) {
    $nodeExecutable = $nodeCommand.Source
} else {
    throw 'Node.js was not found. Install Node.js and ensure the node command is available in PATH.'
}

Set-Location -LiteralPath $repositoryRoot
& $nodeExecutable 'app\server.mjs'

