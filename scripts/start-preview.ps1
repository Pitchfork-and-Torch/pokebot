# Detached static preview of dist/. Returns in under 8 seconds. Does not wait for HTTP.
$ErrorActionPreference = "Stop"
& py -3 (Join-Path $PSScriptRoot "start_preview.py")
exit $LASTEXITCODE
