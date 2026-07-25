# Sync all reviewed data and content from shared warehouse to Astro project
$warehouse = "D:\我的坚果云\fwc2026"
$site = "C:\Users\pc\.openclaw\workspace\coder\worldcup-prediction-site"

# Data mappings: source -> dest
$dataMappings = @(
    @{src="$warehouse\data\predictions\reviewed"; dest="$site\src\data\predictions\reviewed"}
    @{src="$warehouse\data\deductions\reviewed"; dest="$site\src\data\deductions\reviewed"}
    @{src="$warehouse\data\results\reviewed"; dest="$site\src\data\results\reviewed"}
    @{src="$warehouse\data\mystic\reviewed"; dest="$site\src\data\mystic\reviewed"}
    @{src="$warehouse\data\topics\reviewed"; dest="$site\src\data\topics\reviewed"}
)

$contentMappings = @(
    @{src="$warehouse\content\predictions\reviewed"; dest="$site\src\content\predictions\reviewed"}
    @{src="$warehouse\content\deductions\reviewed"; dest="$site\src\content\deductions\reviewed"}
    @{src="$warehouse\content\mystic\reviewed"; dest="$site\src\content\mystic\reviewed"}
    @{src="$warehouse\content\topics\reviewed"; dest="$site\src\content\topics\reviewed"}
)

Write-Host "=== Phase 1: Copy data files ==="
foreach ($m in $dataMappings) {
    $src = $m.src
    $dest = $m.dest
    if (Test-Path $src) {
        # Ensure dest exists
        if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }
        $files = Get-ChildItem "$src\*.json"
        Write-Host "  $($files.Count) JSON files from $src -> $dest"
        foreach ($f in $files) {
            Copy-Item -Path $f.FullName -Destination $dest -Force
        }
    } else {
        Write-Host "  [WARN] Source not found: $src"
    }
}

Write-Host "=== Phase 2: Copy content files ==="
foreach ($m in $contentMappings) {
    $src = $m.src
    $dest = $m.dest
    if (Test-Path $src) {
        if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }
        $files = Get-ChildItem "$src\*.md"
        Write-Host "  $($files.Count) MD files from $src -> $dest"
        foreach ($f in $files) {
            Copy-Item -Path $f.FullName -Destination $dest -Force
        }
    } else {
        Write-Host "  [WARN] Source not found: $src"
    }
}

Write-Host "=== Phase 3: Strip BOM (0xEFBBBF) from all synced JSON and MD files ==="
$reviewedDirs = @(
    "$site\src\data\predictions\reviewed",
    "$site\src\data\deductions\reviewed",
    "$site\src\data\results\reviewed",
    "$site\src\data\mystic\reviewed",
    "$site\src\data\topics\reviewed",
    "$site\src\content\predictions\reviewed",
    "$site\src\content\deductions\reviewed",
    "$site\src\content\mystic\reviewed",
    "$site\src\content\topics\reviewed"
)

$totalBomFixed = 0
foreach ($dir in $reviewedDirs) {
    if (Test-Path $dir) {
        $files = Get-ChildItem "$dir\*" -Include "*.json","*.md"
        foreach ($f in $files) {
            $content = [System.IO.File]::ReadAllBytes($f.FullName)
            if ($content.Length -ge 3 -and $content[0] -eq 0xEF -and $content[1] -eq 0xBB -and $content[2] -eq 0xBF) {
                [System.IO.File]::WriteAllBytes($f.FullName, $content[3..($content.Length-1)])
                Write-Host "  BOM removed: $($f.Name)"
                $totalBomFixed++
            }
        }
    }
}
Write-Host "Total BOM fixes: $totalBomFixed"
Write-Host "=== Sync complete ==="
