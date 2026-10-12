@echo off
title Push to GitHub - NBA 2K26 Mod Manager
echo ===================================================
echo Pushing to https://github.com/yvngsephi/NBA2k26-Mod-Manager.git
echo ===================================================
echo.
git push -u origin master
echo.
if %errorlevel% equ 0 (
    echo Push successful!
) else (
    echo Push failed. If prompted, please complete GitHub sign-in in your browser.
)
pause
