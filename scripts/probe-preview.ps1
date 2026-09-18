# Probe only. Never starts a process. Exits in about 2 seconds.
$ErrorActionPreference = "Stop"
& py -3 (Join-Path $PSScriptRoot "probe_preview.py") @args
exit $LASTEXITCODE
