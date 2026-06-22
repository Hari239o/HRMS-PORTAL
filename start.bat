@echo off
echo =======================================================
echo    FIXING AND STARTING ATTENDANCE GEONIXA PROJECT
echo =======================================================
echo.
echo Step 1: Installing required database drivers...
cd server
call npm install sqlite3
echo.
echo Step 2: Starting the project...
cd ..
call npm run dev
