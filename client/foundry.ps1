# =============================================================================
# OpenClaw Foundry - Thin Client Bootstrap (Windows PowerShell)
#
# Usage:
#   irm http://YOUR_VPS:18800/foundry.ps1 | iex
# =============================================================================

$ErrorActionPreference = "Stop"
$FoundryServer = if ($env:OCF_SERVER_URL) { $env:OCF_SERVER_URL } else { "http://100.106.223.39:18800" }
$ApiKey = $env:OCF_API_KEY
$Action = if ($args.Count -gt 0) { $args[0] } else { "install" }
$OpenClawHome = Join-Path $env:USERPROFILE ".openclaw"
$ManifestFile = Join-Path $OpenClawHome ".foundry-manifest.json"

# --- Uninstall ---
if ($Action -eq "--uninstall") {
    Write-Host "`n  OpenClaw Foundry - Uninstall`n" -ForegroundColor Cyan

    $keepConfig = $args -contains "--keep-config"
    $keepMemory = $args -contains "--keep-memory"

    # Skills
    $skillsDir = Join-Path $OpenClawHome "skills"
    if (Test-Path $skillsDir) {
        $count = (Get-ChildItem $skillsDir -Directory).Count
        Remove-Item "$skillsDir\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "OK Skills removed ($count)" -ForegroundColor Green
    }

    # Agents
    $agentsDir = Join-Path $OpenClawHome "agents"
    if (Test-Path $agentsDir) {
        $count = (Get-ChildItem $agentsDir -Filter "*.json").Count
        Remove-Item "$agentsDir\*.json" -Force -ErrorAction SilentlyContinue
        Write-Host "OK Agents removed ($count)" -ForegroundColor Green
    }

    # Identity
    Remove-Item (Join-Path $OpenClawHome "IDENTITY.md") -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $OpenClawHome "SOUL.md") -Force -ErrorAction SilentlyContinue
    Write-Host "OK Identity files removed" -ForegroundColor Green

    # Config
    if (-not $keepConfig) {
        Remove-Item (Join-Path $OpenClawHome "openclaw.json") -Force -ErrorAction SilentlyContinue
        Write-Host "OK Config removed" -ForegroundColor Green
    } else { Write-Host "OK Config kept (--keep-config)" -ForegroundColor Green }

    # Memory
    if (-not $keepMemory) {
        Remove-Item (Join-Path $OpenClawHome "memory") -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "OK Memory cleared" -ForegroundColor Green
    } else { Write-Host "OK Memory kept (--keep-memory)" -ForegroundColor Green }

    # Manifest
    Remove-Item $ManifestFile -Force -ErrorAction SilentlyContinue

    Write-Host "`n=== Uninstall Complete ===" -ForegroundColor Green
    exit 0
}

# --- Repair ---
if ($Action -eq "--repair") {
    Write-Host "`n  OpenClaw Foundry - Repair`n" -ForegroundColor Cyan

    if (-not (Test-Path $ManifestFile)) {
        Write-Host "ERROR No manifest found. Run installer first." -ForegroundColor Red
        exit 1
    }
    $manifest = Get-Content $ManifestFile -Raw | ConvertFrom-Json
    $fixed = 0

    # Directories
    foreach ($dir in @("$OpenClawHome", "$OpenClawHome\skills", "$OpenClawHome\agents", "$OpenClawHome\memory")) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Write-Host "OK Recreated $dir" -ForegroundColor Green
            $fixed++
        }
    }

    # Identity
    foreach ($f in @("IDENTITY.md", "SOUL.md")) {
        $fp = Join-Path $OpenClawHome $f
        if (-not (Test-Path $fp)) {
            if ($f -eq "IDENTITY.md") {
                "# Identity`n`nRole: $($manifest.blueprint.role)`nSetup: OpenClaw Foundry (repaired)" | Set-Content $fp
            } else {
                "# Soul`n`nYou are a skilled $($manifest.blueprint.role)." | Set-Content $fp
            }
            Write-Host "OK Regenerated $f" -ForegroundColor Green
            $fixed++
        } else { Write-Host "OK $f present" -ForegroundColor Green }
    }

    # Config
    $cfgPath = Join-Path $OpenClawHome "openclaw.json"
    if (-not (Test-Path $cfgPath)) {
        @{ autonomy = @{ level = $manifest.config.autonomy }; model = @{ routing = $manifest.config.modelRouting }; memory = @{ chunks = $manifest.config.memoryChunks } } | ConvertTo-Json -Depth 3 | Set-Content $cfgPath
        Write-Host "OK Regenerated openclaw.json" -ForegroundColor Green
        $fixed++
    } else { Write-Host "OK Config present" -ForegroundColor Green }

    Write-Host ""
    if ($fixed -gt 0) {
        Write-Host "=== Repair Complete: $fixed issue(s) fixed ===" -ForegroundColor Green
    } else {
        Write-Host "=== All checks passed ===" -ForegroundColor Green
    }
    exit 0
}

# --- Banner ---
Write-Host ""
Write-Host "  +======================================+" -ForegroundColor Cyan
Write-Host "  |     OpenClaw Foundry Installer       |" -ForegroundColor Cyan
Write-Host "  |   AI-driven one-click deployment     |" -ForegroundColor Cyan
Write-Host "  +======================================+" -ForegroundColor Cyan
Write-Host ""

# --- Server check ---
Write-Host "NOTE Connecting to $FoundryServer" -ForegroundColor Blue
try {
    $health = Invoke-RestMethod -Uri "$FoundryServer/api/health" -TimeoutSec 5
    Write-Host "OK Server connected" -ForegroundColor Green
} catch {
    Write-Host "ERROR Cannot reach server at $FoundryServer" -ForegroundColor Red
    exit 1
}

# --- Node.js check ---
try {
    $nodeVer = node --version
    $major = [int]($nodeVer -replace 'v(\d+).*', '$1')
    if ($major -lt 18) {
        Write-Host "ERROR Node.js >= 18 required (found $nodeVer)" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK Node.js $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "WARN Node.js not found. Installing via winget..." -ForegroundColor Yellow
    try { winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements }
    catch { Write-Host "ERROR Install Node.js from https://nodejs.org" -ForegroundColor Red; exit 1 }
}

Write-Host ""
Write-Host "--- Setup Questions ---" -ForegroundColor White

# --- Wizard ---
$UserName = Read-Host "Your name [$env:USERNAME]"
if (-not $UserName) { $UserName = $env:USERNAME }

Write-Host ""
Write-Host "  Your primary role:"
Write-Host "    --- Development ---"
Write-Host "     1) Full-Stack Developer       2) Frontend (React/Vue)"
Write-Host "     3) Java/Spring Backend        4) Go Backend"
Write-Host "     5) Python Backend             6) Node.js/TS Backend"
Write-Host "     7) C/C++ Systems              8) iOS/Android Mobile"
Write-Host "     9) Embedded/IoT"
Write-Host "    --- QA & Infra ---"
Write-Host "    10) QA/Testing                11) DevOps/SRE"
Write-Host "    12) DBA                       13) Security Engineer"
Write-Host "    --- Data & AI ---"
Write-Host "    14) Data Analyst/BI           15) Data Engineer"
Write-Host "    16) Algorithm (Rec/NLP/CV)    17) AI/LLM Engineer"
Write-Host "    --- Product & Design ---"
Write-Host "    18) Product Manager           19) AI Product Manager"
Write-Host "    20) Project Manager           21) UI/UX Designer"
Write-Host "    22) Visual/Brand Designer"
Write-Host "    --- Operations ---"
Write-Host "    23) User/Community Ops        24) Content/New Media Ops"
Write-Host "    25) E-commerce Ops            26) Data/Strategy Ops"
Write-Host "    --- Marketing & Sales ---"
Write-Host "    27) SEO/SEM                   28) Marketing/Brand"
Write-Host "    29) Sales/BD                  30) Pre-sales/CS"
Write-Host "    --- Corporate ---"
Write-Host "    31) Finance/Accounting        32) Legal/Compliance"
Write-Host "    33) HR/Recruiting"
Write-Host "    --- Other ---"
Write-Host "    34) CTO/Tech Lead             35) Researcher"
Write-Host "    36) Educator"
$roleNum = Read-Host "  Choose [1-36]"
$roles = @("fullstack-developer","frontend-developer","java-developer","go-developer","python-developer","backend-developer","cpp-developer","mobile-developer","embedded-developer","qa-tester","devops","dba","security-engineer","data-analyst","data-engineer","algorithm-engineer","ml-ai-engineer","product-manager","ai-product-manager","project-manager","designer-ux","visual-designer","user-ops","content-ops","ecommerce-ops","data-ops","seo-sem","marketing-growth","sales-bizdev","customer-support","finance-accounting","compliance","hr-recruiter","cto-tech-lead","researcher","educator")
$role = $roles[[Math]::Max(0, [int]$roleNum - 1)]

# Industry
Write-Host ""
Write-Host "  Your industry:"
Write-Host "    1) SaaS / Enterprise      2) FinTech"
Write-Host "    3) E-commerce / Retail    4) Gaming / Entertainment"
Write-Host "    5) Education / EdTech     6) Healthcare"
Write-Host "    7) Content / Media        8) IoT / Hardware"
Write-Host "    9) AI / LLM-native       10) General / Other"
$indNum = Read-Host "  Choose [1-10]"
$indMap = @("saas","fintech","ecommerce","gaming","education","healthcare","media","iot","ai-native","general")
$industry = $indMap[[Math]::Max(0, [int]$indNum - 1)]

# Experience level
Write-Host ""
Write-Host "  Your experience level:"
Write-Host "    1) Junior (0-2 years)     2) Mid (2-5 years)"
Write-Host "    3) Senior (5-10 years)    4) Lead / Manager"
Write-Host "    5) Director / VP / CTO"
$lvlNum = Read-Host "  Choose [1-5]"
$lvlMap = @("junior","mid","senior","lead","executive")
$level = $lvlMap[[Math]::Max(0, [int]$lvlNum - 1)]

# Team size
Write-Host ""
Write-Host "  Your team size:"
Write-Host "    1) Solo                   2) Small (2-10)"
Write-Host "    3) Medium (10-50)         4) Large (50+)"
$teamNum = Read-Host "  Choose [1-4]"
$teamMap = @("solo","small","medium","large")
$teamSize = $teamMap[[Math]::Max(0, [int]$teamNum - 1)]

Write-Host ""
Write-Host "  Use cases (space-separated numbers):"
Write-Host "     1) Coding          2) Code Review     3) Testing/QA"
Write-Host "     4) API Dev         5) Mobile Dev      6) ML/AI"
Write-Host "     7) DevOps/CI-CD    8) Security"
Write-Host "     9) Project Mgmt   10) Marketing/SEO  11) Sales/BD"
Write-Host "    12) Customer Support 13) Finance      14) E-commerce"
Write-Host "    15) Research        16) Tech Writing   17) Content/Social"
Write-Host "    18) Education       19) Data Analysis  20) Design"
Write-Host "    21) Automation      22) Compliance     23) IoT/Embedded"
$ucInput = Read-Host "  Choose"
$ucMap = @("coding","code-review","testing-qa","api-development","mobile-development","ml-ai","devops-cicd","security","project-management","marketing-seo","sales-bizdev","customer-support","finance-accounting","ecommerce","research","writing","content-social","education-training","data-analysis","design","automation","compliance","iot-embedded")
$useCases = @()
foreach ($n in ($ucInput -split '\s+')) {
    $idx = [int]$n - 1
    if ($idx -ge 0 -and $idx -lt $ucMap.Count) { $useCases += $ucMap[$idx] }
}

Write-Host ""
Write-Host "  What deliverables do you produce? (space-separated numbers, 0=none):"
Write-Host "     1) PDF           2) PPT/Slides    3) Word/Docs     4) Excel"
Write-Host "     5) Text/Articles 6) Images        7) Video         8) Posters"
Write-Host "     9) Diagrams     10) Prototypes   11) Reports      12) Code"
Write-Host "    13) Articles (WeChat/social)"
$delInput = Read-Host "  Choose"
$delMap = @("pdf","ppt","word","excel","text","image","video","poster","diagram","prototype","report","code","article")
$deliverables = @()
foreach ($n in ($delInput -split '\s+')) {
    $idx = [int]$n - 1
    if ($idx -ge 0 -and $idx -lt $delMap.Count) { $deliverables += $delMap[$idx] }
}

Write-Host ""
Write-Host "  Languages (space-separated numbers):"
Write-Host "    1) TS/JS  2) Python  3) Go  4) Rust  5) Java"
Write-Host "    6) Swift  7) C/C++   8) SQL 9) Shell"
$langInput = Read-Host "  Choose"
$langMap = @("typescript","python","go","rust","java","swift","cpp","sql","shell")
$languages = @()
foreach ($n in ($langInput -split '\s+')) {
    $idx = [int]$n - 1
    if ($idx -ge 0 -and $idx -lt $langMap.Count) { $languages += $langMap[$idx] }
}

Write-Host ""
Write-Host "  AI autonomy: 1) L1 Guided  2) L2 Semi  3) L3 Full"
$autoNum = Read-Host "  Choose [1-3]"
$autoMap = @("L1-guided","L2-semi","L3-full")
$autonomy = $autoMap[[Math]::Max(0, [int]$autoNum - 1)]

Write-Host ""
Write-Host "  Integrations (space-separated, 0=none):"
Write-Host "     1) GitHub      2) Telegram   3) Slack     4) Discord"
Write-Host "     5) Notion      6) Linear     7) Jira      8) Google Workspace"
Write-Host "     9) Supabase   10) Vercel    11) AWS      12) Stripe"
Write-Host "    13) Shopify    14) HubSpot   15) PostgreSQL"
$intInput = Read-Host "  Choose"
$intMap = @("github","telegram","slack","discord","notion","linear","jira","google","supabase","vercel","aws","stripe","shopify","hubspot","postgres")
$integrations = @()
foreach ($n in ($intInput -split '\s+')) {
    $idx = [int]$n - 1
    if ($idx -ge 0 -and $idx -lt $intMap.Count) { $integrations += $intMap[$idx] }
}

# --- Build payload ---
$payload = @{
    userName     = $UserName
    os           = "win32"
    role         = $role
    industry     = $industry
    level        = $level
    teamSize     = $teamSize
    useCases     = $useCases
    deliverables = $deliverables
    languages    = $languages
    autonomy     = $autonomy
    integrations = $integrations
    llmMode      = "skip"
} | ConvertTo-Json -Depth 3

Write-Host ""
Write-Host "NOTE Sending to server for AI analysis..." -ForegroundColor Blue

# --- Call server ---
$headers = @{ "Content-Type" = "application/json" }
if ($ApiKey) { $headers["x-api-key"] = $ApiKey }

try {
    $resp = Invoke-RestMethod -Uri "$FoundryServer/api/analyze" -Method Post -Headers $headers -Body $payload
    $blueprint = $resp.blueprint
    Write-Host "OK Blueprint received!" -ForegroundColor Green
} catch {
    Write-Host "ERROR Server analysis failed: $_" -ForegroundColor Red
    exit 1
}

# --- Save blueprint ---
$bpFile = Join-Path $env:TEMP "openclaw-blueprint-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$blueprint | ConvertTo-Json -Depth 10 | Set-Content $bpFile
Write-Host "NOTE Blueprint saved to $bpFile" -ForegroundColor Blue

# --- Execute ---
Write-Host ""
Write-Host "--- Installing OpenClaw ---" -ForegroundColor White

# Install OpenClaw
try { openclaw --version | Out-Null; Write-Host "OK OpenClaw already installed" -ForegroundColor Green }
catch {
    Write-Host "Installing OpenClaw..."
    npm install -g @anthropic/openclaw
}

# Directories
$h = Join-Path $env:USERPROFILE ".openclaw"
New-Item -ItemType Directory -Force -Path "$h\skills","$h\agents","$h\memory" | Out-Null

# Identity
@"
# Identity

Role: $($blueprint.identity.role)
Setup: OpenClaw Foundry
Profile: $($blueprint.meta.profile)
"@ | Set-Content "$h\IDENTITY.md"
Write-Host "OK Identity" -ForegroundColor Green

# Config
@{
    autonomy   = @{ level = $blueprint.config.autonomy }
    model      = @{ routing = $blueprint.config.modelRouting }
    memory     = @{ chunks = $blueprint.config.memoryChunks }
    mcpServers = $blueprint.mcpServers
    extensions = $blueprint.extensions
    _foundry   = @{
        blueprint = $blueprint.meta.name
        profile   = $blueprint.meta.profile
        created   = $blueprint.meta.created
    }
} | ConvertTo-Json -Depth 5 | Set-Content "$h\openclaw.json"
Write-Host "OK Config" -ForegroundColor Green

# Skills
foreach ($skill in $blueprint.skills.fromClawhub) {
    try { openclaw skills install $skill 2>$null; Write-Host "OK Skill: $skill" -ForegroundColor Green }
    catch { Write-Host "WARN Skill: $skill" -ForegroundColor Yellow }
}

# Agents
foreach ($agent in $blueprint.agents) {
    $agent | ConvertTo-Json -Depth 3 | Set-Content "$h\agents\$($agent.name).json"
}
Write-Host "OK Agents ($($blueprint.agents.Count))" -ForegroundColor Green

# Verify
try { openclaw doctor } catch { Write-Host "WARN Run 'openclaw doctor' manually" -ForegroundColor Yellow }

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host "Blueprint: $bpFile"
Write-Host "Run 'openclaw' to start."
