# Update Dashboard Colors from Purple to QUEENTHAIR Brand Colors
# This script replaces purple colors with gold/charcoal across all dashboard files

$replacements = @{
    'bg-purple-600' = 'bg-gold'
    'hover:bg-purple-700' = 'hover:bg-gold-dark'
    'text-purple-600' = 'text-gold'
    'hover:text-purple-700' = 'hover:text-gold-dark'
    'bg-purple-100' = 'bg-gold/10'
    'focus:ring-purple-500' = 'focus:ring-gold'
    'border-purple-600' = 'border-gold'
    'bg-purple-50 text-purple-700' = 'bg-gold/10 text-gold-dark'
    "purple: 'text-purple-600 bg-purple-100'" = "gold: 'text-gold bg-gold/10'"
    "color = 'purple'" = "color = 'gold'"
}

$paths = @(
    'src\components\dashboard\*.jsx',
    'src\pages\dashboard\*.jsx',
    'src\pages\admin\*.jsx',
    'src\components\common\ProtectedRoute.jsx',
    'src\components\common\AdminRoute.jsx'
)

foreach ($pattern in $paths) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        $modified = $false
        
        foreach ($key in $replacements.Keys) {
            if ($content -match [regex]::Escape($key)) {
                $content = $content -replace [regex]::Escape($key), $replacements[$key]
                $modified = $true
            }
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "Updated: $($file.Name)" -ForegroundColor Green
        }
    }
}

Write-Host "`nColor update complete!" -ForegroundColor Cyan
