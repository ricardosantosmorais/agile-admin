@echo off
set "NODE_DIR=%~dp0.tooling\node-v22.22.1-win-x64"
set "PATH=%NODE_DIR%;%PATH%"
"%NODE_DIR%\npx.cmd" %*
