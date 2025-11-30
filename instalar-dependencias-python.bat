@echo off
echo ========================================
echo Instalar Dependencias Python
echo ========================================
echo.
echo Instalando python-dotenv...
python -m pip install python-dotenv
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo Dependencias instaladas com sucesso!
    echo ========================================
) else (
    echo ========================================
    echo Erro ao instalar dependencias
    echo ========================================
)
echo.
pause
