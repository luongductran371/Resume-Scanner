# DOC/DOCX Resume Upload Test (aligned with original PDF tester)
# Uses Invoke-WebRequest with a manually constructed multipart body (to mirror original style)
# Compatible with Windows PowerShell 5.1

# === Configuration ===
$endpoint   = "http://localhost:3000/upload"
$scriptDir  = $PSScriptRoot
# Place a sample DOCX next to this script, or change this path
$filePath   = Join-Path $scriptDir "sample_resume.docx"
$errorLog   = "upload_doc_error.log"
$responseLog = "upload_doc_response.log"

# === Clear logs ===
Remove-Item $responseLog, $errorLog -ErrorAction SilentlyContinue

# === Debug info ===
Write-Host "=== DOC/DOCX RESUME UPLOAD TEST ===" -ForegroundColor Cyan
Write-Host "Uploading file: $filePath"
if (Test-Path -LiteralPath $filePath) {
  Write-Host "File size: $((Get-Item $filePath).Length) bytes"
} else {
  Write-Host "File not found yet (update path or add sample_resume.docx in this folder)" -ForegroundColor Yellow
}
Write-Host "Endpoint: $endpoint"
Write-Host ""

Add-Content -Path $responseLog -Value "Uploading file: $filePath"
if (Test-Path -LiteralPath $filePath) {
  Add-Content -Path $responseLog -Value "File size: $((Get-Item $filePath).Length) bytes"
}
Add-Content -Path $responseLog -Value "Endpoint: $endpoint"
Add-Content -Path $responseLog -Value ""

try {
    # Create a temporary form file (same pattern as the original PDF tester)
    $boundary = [System.Guid]::NewGuid().ToString()
    $tempFormFile = Join-Path $env:TEMP "resume_form_doc.tmp"

    # Read the DOC/DOCX file as bytes
    if (-not (Test-Path -LiteralPath $filePath)) { throw "File not found: $filePath" }
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = [System.IO.Path]::GetFileName($filePath)

    # Infer content type
    $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $contentType = switch ($ext) {
      '.docx' { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      '.doc' { 'application/msword' }
      default { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    }

    # Create multipart form data (manual to match original style)
    $LF = "`r`n"
    $formData = @()
    $formData += "--$boundary$LF"
    $formData += "Content-Disposition: form-data; name=`"resume`"; filename=`"$fileName`"$LF"
    $formData += "Content-Type: $contentType$LF$LF"

    # Convert text parts to bytes
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($formData -join "")
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")

    # Combine all bytes
    $bodyBytes = $headerBytes + $fileBytes + $footerBytes

    # Write to temporary file
    [System.IO.File]::WriteAllBytes($tempFormFile, $bodyBytes)

    # Set headers
    $headers = @{ "Content-Type" = "multipart/form-data; boundary=$boundary" }

    # Execute request
    Write-Host "Sending request..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $endpoint -Method Post -InFile $tempFormFile -Headers $headers -UseBasicParsing

    # Clean up temp file
    Remove-Item $tempFormFile -ErrorAction SilentlyContinue

    Write-Host "✅ REQUEST SENT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green

    # Log raw response
    $responseContent = $response.Content
    Add-Content -Path $responseLog -Value "RAW RESPONSE:"
    Add-Content -Path $responseLog -Value $responseContent
    Add-Content -Path $responseLog -Value ""

    # Try to parse JSON
    try {
        $jsonResponse = $responseContent | ConvertFrom-Json
        Write-Host ""; Write-Host "=== PARSING RESULTS ===" -ForegroundColor Cyan
        Write-Host "✅ RESUME PROCESSED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host ""
        if ($jsonResponse.name)   { Write-Host "   Name: $($jsonResponse.name)" -ForegroundColor Green } else { Write-Host "   Name: (not found)" -ForegroundColor Yellow }
        if ($jsonResponse.email)  { Write-Host "   Email: $($jsonResponse.email)" -ForegroundColor Green } else { Write-Host "   Email: (not found)" -ForegroundColor Yellow }
        if ($jsonResponse.sections -and $jsonResponse.sections.Count -gt 0) {
            Write-Host "   Sections found: $($jsonResponse.sections.Count)" -ForegroundColor Green
            for ($i = 0; $i -lt $jsonResponse.sections.Count; $i++) {
                $section = $jsonResponse.sections[$i]
                $title = if ($section.title) { $section.title } else { "(no title)" }
                $type = if ($section.type) { $section.type } else { "(no type)" }
                $contentCount = if ($section.content) { $section.content.Count } else { 0 }
                Write-Host "     [$i] Title: $title, Type: $type, Content: $contentCount items" -ForegroundColor Cyan
            }
            
            # Also show the old way for comparison
            $sectionTypes = $jsonResponse.sections | ForEach-Object { $_.type } | Where-Object { $_ } | Select-Object -Unique
            if ($sectionTypes) {
                Write-Host "   Section types: $($sectionTypes -join ', ')" -ForegroundColor Green
            } else {
                Write-Host "   Section types: (no types found)" -ForegroundColor Yellow
            }
        } else { Write-Host "   Sections: (none found)" -ForegroundColor Yellow }
    } catch {
        Write-Host "Response received but failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Raw response: $responseContent" -ForegroundColor Gray
        Add-Content -Path $errorLog -Value "JSON parse error: $($_.Exception.Message)"
    }

    Write-Host ""; Write-Host "See $responseLog for full details" -ForegroundColor Gray

} catch {
    # Ensure temp is removed
    $tempFormFile = Join-Path $env:TEMP "resume_form_doc.tmp"
    Remove-Item $tempFormFile -ErrorAction SilentlyContinue

    $errorMessage = $_.Exception.Message
    Add-Content -Path $errorLog -Value "Upload failed: $errorMessage"
    Add-Content -Path $errorLog -Value "Full exception: $($_.Exception.ToString())"

    Write-Host ""; Write-Host "❌ UPLOAD REQUEST FAILED!" -ForegroundColor Red
    Write-Host "   Error: $errorMessage" -ForegroundColor Red
    Write-Host "   See $errorLog for details" -ForegroundColor Red
    Write-Host ""
}

Write-Host "DOC/DOCX upload test completed." -ForegroundColor Gray
