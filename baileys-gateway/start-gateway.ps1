Set-Location $PSScriptRoot
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "File .env dibuat dari .env.example. Cek API_KEY sebelum membuka gateway ke internet." -ForegroundColor Yellow
}
npm start
