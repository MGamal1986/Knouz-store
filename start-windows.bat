@echo off
echo Starting Knouz...

set DATABASE_URL=postgresql://postgres:malek_123@localhost:5432/knouz_db
set NODE_ENV=development
set PORT=5000
set CLERK_SECRET_KEY=sk_test_H5SFokFRN3f4lAzgxK0cRCbbvNovZQfIcl6zV4Zo74

echo Starting API server...
start cmd /k "cd artifacts\api-server && set DATABASE_URL=postgresql://postgres:malek_123@localhost:5432/knouz_db && set PORT=5000 && set NODE_ENV=development && set CLERK_SECRET_KEY=sk_test_H5SFokFRN3f4lAzgxK0cRCbbvNovZQfIcl6zV4Zo74 && node --enable-source-maps ./dist/index.mjs"

timeout /t 3

echo Starting Frontend...
start cmd /k "cd artifacts\knouz && pnpm dev"

echo.
echo Open: http://localhost:5173
pause