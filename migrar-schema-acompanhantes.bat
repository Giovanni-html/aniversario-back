@echo off
echo ========================================
echo Migracao do Schema - Acompanhantes
echo ========================================
echo.

node migrar-schema-acompanhantes.js

echo.
echo ========================================
echo Pressione qualquer tecla para sair...
pause > nul
