@echo off
setlocal
cd /d "%~dp0"
echo Iniciando a plataforma VETOR em servidor local...
echo.
echo Depois que abrir, acesse:
echo http://localhost:8080
echo.
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  py -m http.server 8080
  goto :fim
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  python -m http.server 8080
  goto :fim
)
echo Python nao encontrado. Instale Python ou abra por outro servidor local.
pause
:fim
endlocal
