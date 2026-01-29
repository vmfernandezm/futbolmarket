# Script para reemplazar localhost:3001 con API_URL en todos los archivos .svelte

$files = Get-ChildItem -Path "src" -Filter "*.svelte" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Verificar si el archivo contiene localhost:3001
    if ($content -match "localhost:3001") {
        Write-Host "Actualizando: $($file.FullName)"
        
        # Verificar si ya tiene el import
        $hasImport = $content -match "import.*API_URL.*from.*config"
        
        # Si no tiene el import, agregarlo
        if (-not $hasImport -and $content -match "<script>") {
            $content = $content -replace "(<script>)", "`$1`n`timport { API_URL } from '`$lib/config';"
        }
        
        # Reemplazar todas las instancias de localhost:3001
        $content = $content -replace "http://localhost:3001", "`${API_URL}"
        $content = $content -replace "'http://localhost:3001", "``${API_URL}"
        $content = $content -replace '"http://localhost:3001', "`${API_URL}"
        
        # Guardar el archivo
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✓ Actualizado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Proceso completado!" -ForegroundColor Green
