#!/usr/bin/env pwsh
# Test Device API Endpoints - Simple Version

$API_URL = "http://localhost:3001/api"

Write-Host "=== Testing Device API ===" -ForegroundColor Cyan
Write-Host ""

# Helper function
function Test-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null,
        [string]$Label = ""
    )
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri     = "$API_URL$Endpoint"
            Method  = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        return $response.Content | ConvertFrom-Json
    }
    catch {
        Write-Host "✗ $Label Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        return $null
    }
}

# Step 1: Login
Write-Host "1. Testing Login..." -ForegroundColor Yellow
$loginData = @{
    email    = "admin@trackify.com"
    password = "admin123"
}
$loginResp = Test-Api -Method POST -Endpoint "/auth/login" -Body $loginData -Label "Login"

if ($loginResp) {
    $token = $loginResp.access_token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
}
else {
    Write-Host "✗ Login failed, stopping tests" -ForegroundColor Red
    exit 1
}

# Step 2: Get devices before
Write-Host "`n2. Getting devices (before add)..." -ForegroundColor Yellow
$devicesResp = Test-Api -Method GET -Endpoint "/devices" -Token $token -Label "Get devices"

if ($devicesResp) {
    $count = if ($devicesResp -is [array]) { $devicesResp.Count } else { if ($devicesResp.items) { $devicesResp.items.Count } else { 0 } }
    Write-Host "✓ Fetched: $count devices" -ForegroundColor Green
}

# Step 3: Create device
Write-Host "`n3. Creating new device..." -ForegroundColor Yellow
$deviceData = @{
    name              = "Test Scanner API"
    device_type       = "scanner"
    serial_number     = "SN-API-TEST-$(Get-Random -Minimum 10000 -Maximum 99999)"
    firmware_version  = "1.0.0"
}

Write-Host "  Request: $($deviceData | ConvertTo-Json)" -ForegroundColor Gray
$createResp = Test-Api -Method POST -Endpoint "/devices" -Body $deviceData -Token $token -Label "Create device"

if ($createResp) {
    $deviceId = $createResp.id
    $apiKey = $createResp.api_key
    Write-Host "✓ Device created successfully" -ForegroundColor Green
    Write-Host "  ID: $deviceId" -ForegroundColor Gray
    Write-Host "  Type: $($createResp.device_type)" -ForegroundColor Gray
    Write-Host "  API Key: $($apiKey.Substring(0, 10))..." -ForegroundColor Gray
    Write-Host "  Status: $($createResp.status)" -ForegroundColor Gray
}

# Step 4: Get devices after
Write-Host "`n4. Getting devices (after add)..." -ForegroundColor Yellow
$devicesResp = Test-Api -Method GET -Endpoint "/devices" -Token $token -Label "Get devices"

if ($devicesResp) {
    $count = if ($devicesResp -is [array]) { $devicesResp.Count } else { if ($devicesResp.items) { $devicesResp.items.Count } else { 0 } }
    Write-Host "✓ Fetched: $count devices" -ForegroundColor Green
    
    if ($devicesResp -is [array] -and $devicesResp.Count -gt 0) {
        Write-Host "  First device: $($devicesResp[0].name) (Type: $($devicesResp[0].device_type))" -ForegroundColor Gray
    }
    elseif ($devicesResp.items -and $devicesResp.items.Count -gt 0) {
        Write-Host "  First device: $($devicesResp.items[0].name) (Type: $($devicesResp.items[0].device_type))" -ForegroundColor Gray
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
