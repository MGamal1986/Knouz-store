@echo off
echo === Knouz Windows Setup ===

echo [1/4] Installing packages...
pnpm install

echo [2/4] Installing Windows binaries...
pnpm add -w @rollup/rollup-win32-x64-msvc
pnpm add -w @tailwindcss/oxide-win32-x64-msvc
pnpm add -w lightningcss-win32-x64-msvc

echo [3/4] Building API server...
cd artifacts\api-server
node ./build.mjs
cd ..\..

echo [4/4] Running DB migrations...
cd lib\db
node_modules\.bin\drizzle-kit push --dialect=postgresql --schema=./src/schema --url=%DATABASE_URL%
cd ..\..

echo === Done! Run start-windows.bat to start the project ===
pause