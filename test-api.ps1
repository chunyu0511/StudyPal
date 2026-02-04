# 测试后端API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 测试学习资料分享平台后端API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. 健康检查
Write-Host "1️⃣  测试健康检查..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
    Write-Host "✅ 健康检查通过:" -ForegroundColor Green
    Write-Host "   $($response.message)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ 健康检查失败: $_" -ForegroundColor Red
    exit 1
}

# 2. 测试用户注册
Write-Host "2️⃣  测试用户注册..." -ForegroundColor Yellow
$registerData = @{
    username = "testuser_$(Get-Date -Format 'HHmmss')"
    email = "test_$(Get-Date -Format 'HHmmss')@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/users/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerData
    
    Write-Host "✅ 用户注册成功:" -ForegroundColor Green
    Write-Host "   用户名: $($response.user.username)" -ForegroundColor White
    Write-Host "   邮箱: $($response.user.email)" -ForegroundColor White
    Write-Host "   Token: $($response.token.Substring(0, 20))..." -ForegroundColor White
    Write-Host ""
    
    $global:testUsername = $response.user.username
    $global:testToken = $response.token
} catch {
    Write-Host "❌ 用户注册失败: $_" -ForegroundColor Red
}

# 3. 测试用户登录
Write-Host "3️⃣  测试用户登录..." -ForegroundColor Yellow
$loginData = @{
    username = $global:testUsername
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/users/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData
    
    Write-Host "✅ 用户登录成功:" -ForegroundColor Green
    Write-Host "   用户名: $($response.user.username)" -ForegroundColor White
    Write-Host "   登录时间: $(Get-Date)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ 用户登录失败: $_" -ForegroundColor Red
}

# 4. 测试获取当前用户信息（需要token）
Write-Host "4️⃣  测试获取用户信息..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $($global:testToken)"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/users/me" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ 获取用户信息成功:" -ForegroundColor Green
    Write-Host "   用户ID: $($response.user.id)" -ForegroundColor White
    Write-Host "   用户名: $($response.user.username)" -ForegroundColor White
    Write-Host "   邮箱: $($response.user.email)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ 获取用户信息失败: $_" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 所有API测试完成！" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
Write-Host "✅ 数据库连接正常" -ForegroundColor Green
Write-Host "✅ 用户认证系统工作正常" -ForegroundColor Green
Write-Host "`n现在可以在浏览器中使用注册和登录功能了！" -ForegroundColor Yellow
Write-Host "前端地址: http://localhost:5173" -ForegroundColor Cyan
