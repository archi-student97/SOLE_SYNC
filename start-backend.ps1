$port = 8010
$backendDir = "c:\Users\archi\OneDrive\Desktop\copy\backend"
$logDir = Join-Path $backendDir "logs"
$logFile = Join-Path $logDir "uvicorn-8010.log"

if (!(Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Test-PortListening($portToCheck) {
  $lines = netstat -ano | Select-String ":$portToCheck"
  foreach ($line in $lines) {
    if ($line -match "LISTENING") {
      return $true
    }
  }
  return $false
}

if (Test-PortListening $port) {
  Write-Output "Backend already running on http://localhost:$port"
  exit 0
}

$cmd = "python -m uvicorn app.main:app --host 127.0.0.1 --port $port"
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -WindowStyle Hidden -Command cd '$backendDir'; $cmd *>> '$logFile'" | Out-Null

Start-Sleep -Seconds 2
if (Test-PortListening $port) {
  Write-Output "Backend started: http://localhost:$port"
} else {
  Write-Output "Backend failed to start. Check log: $logFile"
}
