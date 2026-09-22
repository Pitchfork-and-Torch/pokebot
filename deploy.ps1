# Deploy pokebot.jonbailey.xyz to Cloudflare Pages (dist + Pages Function /api/identify)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dist = Join-Path $Root "dist"
$Project = if ($env:POKEBOT_PAGES_PROJECT) { $env:POKEBOT_PAGES_PROJECT } else { "pokebot-jonbailey" }
$Domain = "pokebot.jonbailey.xyz"
$TokenFile = Join-Path $env:USERPROFILE ".grok\secrets\cloudflare_full_token.txt"

if (-not $env:CLOUDFLARE_API_TOKEN) {
  $userTok = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
  if ($userTok) { $env:CLOUDFLARE_API_TOKEN = $userTok }
  elseif (Test-Path -LiteralPath $TokenFile) {
    $env:CLOUDFLARE_API_TOKEN = (Get-Content -LiteralPath $TokenFile -Raw).Trim()
  }
}

if (-not (Test-Path (Join-Path $Dist "index.html"))) {
  Write-Error "Missing dist/index.html - run npm run build first"
}
if (-not (Test-Path (Join-Path $Dist "og.jpg"))) {
  Write-Error "Missing dist/og.jpg"
}

Write-Host "[DEPLOY] PokeBot Pages project=$Project"
Push-Location $Root
try {
  $listed = npx --yes wrangler@4 pages project list 2>&1 | Out-String
  if ($listed -notmatch [regex]::Escape($Project)) {
    Write-Host "[DEPLOY] creating Pages project $Project"
    npx --yes wrangler@4 pages project create $Project --production-branch main
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }

  npx --yes wrangler@4 pages deploy $Dist --project-name=$Project --branch main --commit-dirty=true
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  if ($env:CLOUDFLARE_API_TOKEN) {
    if (-not $env:CLOUDFLARE_ACCOUNT_ID) { $env:CLOUDFLARE_ACCOUNT_ID = "75c71da18eeb801b3408c812742d6590" }
    Write-Host "[DEPLOY] attach custom domain $Domain if needed"
    py -3 -c @"
import json, os, urllib.request
tok = os.environ.get('CLOUDFLARE_API_TOKEN') or ''
acct = os.environ.get('CLOUDFLARE_ACCOUNT_ID') or ''
headers = {'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json', 'User-Agent': 'pokebot-deploy'}
def api(method, url, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())
z = api('GET', 'https://api.cloudflare.com/client/v4/zones?name=jonbailey.xyz')
zid = z['result'][0]['id']
dom = api('POST', f'https://api.cloudflare.com/client/v4/accounts/{acct}/pages/projects/pokebot-jonbailey/domains', {'name': 'pokebot.jonbailey.xyz'})
print('pages-domain', 'ok' if dom.get('success') else dom.get('errors'))
ex = api('GET', f'https://api.cloudflare.com/client/v4/zones/{zid}/dns_records?name=pokebot.jonbailey.xyz')
recs = ex.get('result') or []
need = True
for rec in recs:
    if rec.get('type') == 'CNAME' and str(rec.get('content','')).rstrip('.') == 'pokebot-jonbailey.pages.dev':
        need = False
        print('dns exists', rec.get('id'))
        break
    print('dns leftover', rec.get('type'), rec.get('content'), rec.get('id'))
if need:
    created = api('POST', f'https://api.cloudflare.com/client/v4/zones/{zid}/dns_records', {'type':'CNAME','name':'pokebot','content':'pokebot-jonbailey.pages.dev','proxied':True,'ttl':1})
    print('dns created' if created.get('success') else created.get('errors'))
"@
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Site:    https://$Domain/"
Write-Host "Preview: https://$Project.pages.dev/"
Write-Host "Source:  $Root"
