# Test Device API Endpoints
$API_URL = "http://localhost:3001/api"

Write-Host "=== Testing Device API ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Testing Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@trackify.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResp = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $loginData = $loginResp.Content | ConvertFrom-Json
    $token = $loginData.access_token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get Devices before adding
Write-Host "`n2. Getting devices (before)..." -ForegroundColor Yellow
try {
    $devicesResp = Invoke-WebRequest -Uri "$API_URL/devices" `
        -Method GET `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -ErrorAction Stop

    $devices = $devicesResp.Content | ConvertFrom-Json
    $count = if ($devices -is [array]) { $devices.Count } else { if ($devices) { 1 } else { 0 } }
    Write-Host "✓ Fetched devices: $count devices" -ForegroundColor Green
    if ($count -gt 0) {
        $devices | Select-Object -First 1 | ConvertTo-Json | Write-Host -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Get devices failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Create Device
Write-Host "`n3. Creating new device..." -ForegroundColor Yellow
try {
    $deviceBody = @{
        name = "Test Scanner API"
        device_type = "scanner"
        serial_number = "SN-API-TEST-$(Get-Random)"
        location_id = $null
        firmware_version = "1.0.0"
    } | ConvertTo-Json

    Write-Host "  Sending: $deviceBody" -ForegroundColor Gray

    $createResp = Invoke-WebRequest -Uri "$API_URL/devices" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body $deviceBody `
        -ErrorAction Stop

    $createdDevice = $createResp.Content | ConvertFrom-Json
    $deviceId = $createdDevice.id
    Write-Host "✓ Device created successfully" -ForegroundColor Green
    Write-Host "  ID: $deviceId" -ForegroundColor Gray
    Write-Host "  API Key: $($createdDevice.api_key.Substring(0, 10))..." -ForegroundColor Gray
    Write-Host "  Response: $(($createdDevice | ConvertTo-Json) | Select-Object -First 3)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Create device failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Step 4: Get Devices after adding
Write-Host "`n4. Getting devices (after)..." -ForegroundColor Yellow
try {
    $devicesResp = Invoke-WebRequest -Uri "$API_URL/devices" `
        -Method GET `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -ErrorAction Stop

    $devices = $devicesResp.Content | ConvertFrom-Json
    $count = if ($devices -is [array]) { $devices.Count } else { if ($devices) { 1 } else { 0 } }
    Write-Host "✓ Fetched devices: $count devices" -ForegroundColor Green
    if ($devices.items) {
        Write-Host "  Response has items array with $($devices.items.Count) items" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Get devices failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
