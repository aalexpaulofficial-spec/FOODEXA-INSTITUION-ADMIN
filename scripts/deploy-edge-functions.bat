@echo off
echo Deploying Edge Functions and Secrets for FOODEXA Institution Platform
echo ================================================

REM Check for Deno or Supabase CLI
setlocal

REM Try to locate Supabase CLI
where supabase >nul 2>nul
if %errorlevel% == 0 (
    echo Using Supabase CLI
    supabase functions deploy
    if %errorlevel% neq 0 (
        echo Supabase CLI deploy failed, attempting manual deployment
        goto manual
    ) else (
        echo Edge Functions deployed successfully
    )
) else (
    :manual
    echo Manual Edge Function deployment required:
    echo.
    echo 1. Install Supabase CLI: npm install -g @supabase/cli
    echo 2. Login to Supabase: supabase login
    echo 3. Link project: supabase link --project-id oxsbkwcmpsadbcceaalc
    echo 4. Deploy functions: supabase functions deploy
    echo.
    echo After deployment, set the following secrets via:
    echo supabase secrets set --service_role_key=YOUR_SUPABASE_SERVICE_ROLE_KEY
    echo supabase secrets set --portal_url=https://foodexa-institution-platform.vercel.app
    echo supabase secrets set --resend_api_key=YOUR_RESEND_API_KEY
    echo supabase secrets set --gemini_api_key=YOUR_GEMINI_API_KEY
)

echo.
echo Edge Function deployment process completed.
pause