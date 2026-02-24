@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

cd /d "%~dp0"

echo === Hugo 一键新建文章 ===
set /p TITLE=请输入文章标题（可中文）： 

set /p SLUG=请输入文章路径slug（建议英文/拼音，用-分隔；直接回车自动生成）：
if "%SLUG%"=="" (
  for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set SLUG=post-%%i
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-ddTHH:mm:ssK"') do set NOW=%%i

set POSTDIR=content\posts\%SLUG%
set POSTFILE=%POSTDIR%\index.md

if exist "%POSTFILE%" (
  echo [错误] 该文章已存在：%POSTFILE%
  pause
  exit /b 1
)

mkdir "%POSTDIR%" >nul 2>&1

(
  echo +++
  echo title = "%TITLE%"
  echo date = "%NOW%"
  echo draft = false
  echo +++
  echo.
  echo 这里开始写正文。
  echo.
  echo ^![插入同目录图片](demo.jpg^)
  echo.
  echo ^[外链示例](https://example.com^)
  echo ^[站内关于页](/about/^)
) > "%POSTFILE%"

echo.
echo 已创建：%POSTFILE%
echo 你可以把图片直接放进：%POSTDIR%
echo 然后在文章里用：![说明](图片名.jpg)
echo.

code .
code "%POSTFILE%"
endlocal