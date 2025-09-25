# Fixed PowerShell script to upload a resume file to the API endpoint
# This version uses Invoke-WebRequest with proper multipart form handling
# Compatible with Windows PowerShell 5.1

$endpoint = "http://localhost:3000/upload"
$scriptDir = $PSScriptRoot
$filePath = Join-Path $scriptDir "sample_resume.pdf"
$errorLog = "upload_error.log"
$responseLog = "upload_response.log"

# Clear previous logs
Remove-Item $responseLog, $errorLog -ErrorAction SilentlyContinue

# Debug information
Write-Host "=== RESUME UPLOAD TEST ===" -ForegroundColor Cyan
Write-Host "Uploading file: $filePath"
Write-Host "File size: $((Get-Item $filePath).Length) bytes"
Write-Host "Endpoint: $endpoint"
Write-Host ""

Add-Content -Path $responseLog -Value "Uploading file: $filePath"
Add-Content -Path $responseLog -Value "File size: $((Get-Item $filePath).Length) bytes"
Add-Content -Path $responseLog -Value "Endpoint: $endpoint"
Add-Content -Path $responseLog -Value ""

try {
    # Method 1: Try using Invoke-WebRequest with -InFile (simpler approach)
    Write-Host "Attempting upload using Invoke-WebRequest..." -ForegroundColor Yellow
    
    # Create a temporary form file
    $boundary = [System.Guid]::NewGuid().ToString()
    $tempFormFile = Join-Path $env:TEMP "resume_form.tmp"
    
    # Read the PDF file as bytes
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = [System.IO.Path]::GetFileName($filePath)
    
    # Create multipart form data manually but more reliably
    $LF = "`r`n"
    $formData = @()
    $formData += "--$boundary$LF"
    $formData += "Content-Disposition: form-data; name=`"resume`"; filename=`"$fileName`"$LF"
    $formData += "Content-Type: application/pdf$LF$LF"
    
    # Convert text parts to bytes
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($formData -join "")
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
    
    # Combine all bytes
    $bodyBytes = $headerBytes + $fileBytes + $footerBytes
    
    # Write to temporary file
    [System.IO.File]::WriteAllBytes($tempFormFile, $bodyBytes)
    
    # Set headers
    $headers = @{
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    # Execute request
    Write-Host "Sending request..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $endpoint -Method Post -InFile $tempFormFile -Headers $headers -UseBasicParsing
    
    # Clean up temp file
    Remove-Item $tempFormFile -ErrorAction SilentlyContinue
    
    Write-Host "✅ REQUEST SENT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    
    # Log the raw response
    $responseContent = $response.Content
    Add-Content -Path $responseLog -Value "RAW RESPONSE:"
    Add-Content -Path $responseLog -Value $responseContent
    Add-Content -Path $responseLog -Value ""
    
    # Try to parse JSON response
    try {
        $jsonResponse = $responseContent | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "=== RESUME PARSING RESULTS ===" -ForegroundColor Cyan
        Write-Host "✅ RESUME PROCESSED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host ""
        
        # Display parsed data
        if ($jsonResponse.name) {
            Write-Host "   Name: $($jsonResponse.name)" -ForegroundColor Green
        } else {
            Write-Host "   Name: (not found)" -ForegroundColor Yellow
        }
        
        if ($jsonResponse.email) {
            Write-Host "   Email: $($jsonResponse.email)" -ForegroundColor Green
        } else {
            Write-Host "   Email: (not found)" -ForegroundColor Yellow
        }
        
        if ($jsonResponse.sections -and $jsonResponse.sections.Count -gt 0) {
            $sectionTypes = $jsonResponse.sections | ForEach-Object { $_.type } | Where-Object { $_ } | Select-Object -Unique
            Write-Host "   Sections: $($sectionTypes -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "   Sections: (none found)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "⚠️  Response received but failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Raw response: $responseContent" -ForegroundColor Gray
        Add-Content -Path $errorLog -Value "JSON parse error: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Write-Host "See $responseLog for full details" -ForegroundColor Gray
    
} catch {
    # Clean up temp file if it exists
    $tempFormFile = Join-Path $env:TEMP "resume_form.tmp"
    Remove-Item $tempFormFile -ErrorAction SilentlyContinue
    
    $errorMessage = $_.Exception.Message
    Add-Content -Path $errorLog -Value "Upload failed: $errorMessage"
    Add-Content -Path $errorLog -Value "Full exception: $($_.Exception.ToString())"
    
    Write-Host ""
    Write-Host "❌ UPLOAD REQUEST FAILED!" -ForegroundColor Red
    Write-Host "   Error: $errorMessage" -ForegroundColor Red
    Write-Host "   See $errorLog for details" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Upload test completed." -ForegroundColor Gray
