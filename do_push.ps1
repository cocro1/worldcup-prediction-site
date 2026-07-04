$ErrorActionPreference = "Stop"
$logFile = "C:\Users\pc\AppData\Local\Temp\push_result.txt"

Set-Location "C:\Users\pc\.openclaw\workspace\coder\worldcup-prediction-site"

"=== git status ===" | Out-File $logFile
git status --short >> $logFile 2>&1

"=== git add ===" >> $logFile
git add -A 2>&1 | Out-Null

"=== git commit ===" >> $logFile
git commit -m "fix: sync predictions 07-05~07-08 to reviewed/" >> $logFile 2>&1

"=== git push ===" >> $logFile
git push origin main >> $logFile 2>&1

"=== DONE ===" >> $logFile
