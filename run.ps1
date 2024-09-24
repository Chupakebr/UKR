# Disable proxy settings
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable -Value 0

# Optional: Verify proxy is disabled
$proxyStatus = Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable
if ($proxyStatus.ProxyEnable -eq 0) {
    Write-Host "Proxy is disabled"
} else {
    Write-Host "Failed to disable proxy"
}

# Run the Python script
python C:\Users\I338058\PythoneCode\UKR\Try.py