@echo off
title Reino em Conflito - Inicializando...
echo.
echo  ==========================================
echo  ✨ REINO EM CONFLITO - SERVIDOR MEDIEVAL ✨
echo  ==========================================
echo.
echo  🚀 Iniciando o servidor Node.js...
echo.

:: Verifica se a pasta node_modules existe, se nao existir, instala dependencias
if not exist "node_modules\" (
    echo  📦 Instalando dependencias necessarias...
    call npm install
)

:: Inicia o servidor em segundo plano
start /b node server/server.js

echo  ⏳ Aguardando o servidor carregar...
timeout /t 3 /nobreak > nul

:: Abre o navegador
echo  🌐 Abrindo o Reino no seu navegador (localhost:4000)...
start http://localhost:4000

echo.
echo  ✅ O jogo esta em execucao!
echo  ⚔️  BOM DUELO, MEU REI! ⚔️
echo.
echo  Para encerrar o servidor, basta fechar esta janela.
echo.

:: Mantem o processo do node rodando enquanto a janela bat estiver aberta
pause > nul
taskkill /f /im node.exe > nul 2>&1
exit
