@echo off
setlocal enabledelayedexpansion

REM GitHub Claude Workflow - Label Setup Script (Windows)
REM Creates all required labels for the workflow state machine

echo GitHub Claude Workflow - Label Setup
echo ======================================

REM Check if gh CLI is installed
gh --version >nul 2>&1
if errorlevel 1 (
    echo Error: GitHub CLI ^(gh^) is not installed
    echo Install it from: https://cli.github.com/
    exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>&1
if errorlevel 1 (
    echo Error: Not authenticated with GitHub CLI
    echo Run: gh auth login
    exit /b 1
)

REM Get current repository
for /f "tokens=*" %%i in ('gh repo view --json nameWithOwner -q .nameWithOwner 2^>nul') do set REPO=%%i
if "!REPO!"=="" (
    echo Error: Not in a GitHub repository or repository not found
    exit /b 1
)

echo Setting up labels for repository: !REPO!
echo.

echo Creating 'needs:*' labels ^(AI working^)...
call :create_label "needs:specify" "AI is creating specification for this issue" "5319e7"
call :create_label "needs:specify-revision" "AI is revising specification based on feedback" "5319e7"
call :create_label "needs:plan" "AI is creating technical plan and task breakdown for this issue" "f57c00"
call :create_label "needs:plan-revision" "AI is revising technical plan based on feedback" "f57c00"
call :create_label "needs:develop" "AI is implementing code for this issue" "2e7d32"
call :create_label "needs:develop-revision" "AI is revising implementation based on feedback" "2e7d32"

echo.
echo Creating 'review:*' labels ^(human review required^)...
call :create_label "review:specify" "Specification ready for human review" "ba68c8"
call :create_label "review:plan" "Technical plan and task breakdown ready for human review" "ffb74d"
call :create_label "review:develop" "Implementation ready for human review" "a5d6a7"

echo.
echo Creating 'error:*' labels ^(needs human intervention^)...
call :create_label "error:specify" "Specification stage encountered an error" "d32f2f"
call :create_label "error:plan" "Planning stage encountered an error" "d32f2f"
call :create_label "error:develop" "Development stage encountered an error" "d32f2f"

echo.
echo ✅ Label setup complete!
echo.
echo Usage:
echo 1. Create an issue describing your feature or bug
echo 2. Comment: @claude-dev-truefrontier
echo 3. The workflow will automatically start with 'needs:specify' label
echo.
echo Label Colors:
echo Purple: specify stage. Orange: plan stage. Green: develop stage.
echo Red: error:* ^(needs help^)
echo.
echo Note: Only one workflow label should be active per issue at a time

goto :eof

:create_label
set "name=%~1"
set "description=%~2"
set "color=%~3"

echo|set /p="Creating label: %name%... "

gh label create "%name%" --description "%description%" --color "%color%" >nul 2>&1
if errorlevel 1 (
    REM Label might already exist, try to update it
    gh label edit "%name%" --description "%description%" --color "%color%" >nul 2>&1
    if errorlevel 1 (
        echo ✗ Failed
    ) else (
        echo ✓ Updated
    )
) else (
    echo ✓ Created
)
goto :eof