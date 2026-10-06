@echo off
chcp 65001 > nul
title Quan ly He thong WMS Microservices & Storefront

rem Kiem tra neu goi lenh stop truc tiep tu command line
if /i "%1"=="stop" goto :STOP_ALL_CLI
if /i "%1"=="--stop" goto :STOP_ALL_CLI

rem Khoi tao trang thai cac dich vu: 1 = Dang bat, 0 = Da tat
rem 1: API Gateway [8080]
rem 2: Auth Service [8081]
rem 3: Product Service [8082]
rem 4: Warehouse Service [8083]
rem 5: Customer Service [8084]
rem 6: WMS Frontend [5173]
rem 7: Storefront Frontend [5174]
set S1=1
set S2=1
set S3=1
set S4=1
set S5=1
set S6=1
set S7=1

:AUTO_START_ALL
cls
echo ======================================================================
echo       HE THONG WMS MICROSERVICES & STOREFRONT VELVETY
echo ======================================================================
echo   Dang tu dong khoi dong toan bo cac dich vu...
echo ======================================================================
echo.

rem 1. Auth Service [8081]
netstat -ano -p tcp | findstr :8081 | findstr LISTENING > nul 2>&1
if %errorlevel%==0 goto :SKIP_INIT_AUTH
echo [1/7] Dang khoi dong Auth Service [Cong 8081]...
start "WMS - Auth Service (8081)" cmd /k "cd /d %~dp0auth-service && .\mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul
goto :DONE_INIT_AUTH
:SKIP_INIT_AUTH
echo [i] Auth Service [Port 8081] da dang chay san. Bo qua.
:DONE_INIT_AUTH
set S2=1

rem 2. Product Service [8082]
netstat -ano -p tcp | findstr :8082 | findstr LISTENING > nul 2>&1
if %errorlevel%==0 goto :SKIP_INIT_PROD
echo [2/7] Dang khoi dong Product Service [Cong 8082]...
start "WMS - Product Service (8082)" cmd /k "cd /d %~dp0product-service && .\mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul
goto :DONE_INIT_PROD
:SKIP_INIT_PROD
echo [i] Product Service [Port 8082] da dang chay san. Bo qua.
:DONE_INIT_PROD
set S3=1

rem 3. Warehouse Service [8083]
netstat -ano -p tcp | findstr :8083 | findstr LISTENING > nul 2>&1
if %errorlevel%==0 goto :SKIP_INIT_WH
echo [3/7] Dang khoi dong Warehouse Service [Cong 8083]...
start "WMS - Warehouse Service (8083)" cmd /k "cd /d %~dp0warehouse-service && .\mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul
goto :DONE_INIT_WH
:SKIP_INIT_WH
echo [i] Warehouse Service [Port 8083] da dang chay san. Bo qua.
:DONE_INIT_WH
set S4=1

rem 4. Customer Service [8084]
netstat -ano -p tcp | findstr :8084 | findstr LISTENING > nul 2>&1
if %errorlevel%==0 goto :SKIP_INIT_CUST
echo [4/7] Dang khoi dong Customer Service [Cong 8084]...
start "WMS - Customer Service (8084)" cmd /k "cd /d %~dp0customer-service && .\mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul
goto :DONE_INIT_CUST
:SKIP_INIT_CUST
echo [i] Customer Service [Port 8084] da dang chay san. Bo qua.
:DONE_INIT_CUST
set S5=1

rem 5. API Gateway [8080]
netstat -ano -p tcp | findstr :8080 | findstr LISTENING > nul 2>&1
if %errorlevel%==0 goto :SKIP_INIT_GW
echo [5/7] Dang khoi dong API Gateway [Cong 8080]...
start "WMS - API Gateway (8080)" cmd /k "cd /d %~dp0api-gateway && .\mvnw.cmd spring-boot:run"
timeout /t 4 /nobreak > nul
goto :DONE_INIT_GW
:SKIP_INIT_GW
echo [i] API Gateway [Port 8080] da dang chay san. Bo qua.
:DONE_INIT_GW
set S1=1

rem 6. WMS Frontend React [5173]
netstat -ano -p tcp | findstr :5173 | findstr LISTENING > nul 2>&1
if %errorlevel%==0 goto :SKIP_INIT_FE
echo [6/7] Dang khoi dong WMS Frontend [Cong 5173]...
start "WMS - Frontend (5173)" cmd /k "cd /d %~dp0crs-frontend && npm run dev"
timeout /t 2 /nobreak > nul
goto :DONE_INIT_FE
:SKIP_INIT_FE
echo [i] WMS Frontend [Port 5173] da dang chay san. Bo qua.
:DONE_INIT_FE
set S6=1

rem 7. Storefront Frontend React [5174]
netstat -ano -p tcp | findstr :5174 | findstr LISTENING > nul 2>&1
if %errorlevel%==0 goto :SKIP_INIT_STOREFRONT
echo [7/7] Dang khoi dong Storefront Frontend [Cong 5174]...
start "WMS - Storefront (5174)" cmd /k "cd /d %~dp0storefront-frontend && npm run dev"
timeout /t 2 /nobreak > nul
goto :DONE_INIT_STOREFRONT
:SKIP_INIT_STOREFRONT
echo [i] Storefront Frontend [Port 5174] da dang chay san. Bo qua.
:DONE_INIT_STOREFRONT
set S7=1

echo.
echo ======================================================================
echo   DA KHOI DONG XONG TAT CA CAC DICH VU!
echo   Vui long doi mot vai giay de cac tien trinh hoan tat khoi dong.
echo ======================================================================
timeout /t 2 /nobreak > nul
goto :MENU

:MENU
cls
echo ======================================================================
echo       HE THONG WMS MICROSERVICES & STOREFRONT VELVETY
echo ======================================================================
echo   WMS Admin:    http://localhost:5173
echo   Storefront:   http://localhost:5174
echo   API Gateway:  http://localhost:8080
echo   Tai khoan WMS: admin/admin123  ^|  manager/manager123  ^|  staff/staff123
echo ======================================================================
echo.
echo [MENU DIEU KHIEN DICH VU]:
echo.

set "TXT1=1. Bat api-gateway          [Port 8080 - Da tat]"
if "%S1%"=="1" set "TXT1=1. Tat api-gateway          [Port 8080 - Dang chay]"

set "TXT2=2. Bat auth-service         [Port 8081 - Da tat]"
if "%S2%"=="1" set "TXT2=2. Tat auth-service         [Port 8081 - Dang chay]"

set "TXT3=3. Bat product-service      [Port 8082 - Da tat]"
if "%S3%"=="1" set "TXT3=3. Tat product-service      [Port 8082 - Dang chay]"

set "TXT4=4. Bat warehouse-service    [Port 8083 - Da tat]"
if "%S4%"=="1" set "TXT4=4. Tat warehouse-service    [Port 8083 - Dang chay]"

set "TXT5=5. Bat customer-service     [Port 8084 - Da tat]"
if "%S5%"=="1" set "TXT5=5. Tat customer-service     [Port 8084 - Dang chay]"

set "TXT6=6. Bat wms-frontend         [Port 5173 - Da tat]"
if "%S6%"=="1" set "TXT6=6. Tat wms-frontend         [Port 5173 - Dang chay]"

set "TXT7=7. Bat storefront-frontend  [Port 5174 - Da tat]"
if "%S7%"=="1" set "TXT7=7. Tat storefront-frontend  [Port 5174 - Dang chay]"

echo   %TXT1%
echo   %TXT2%
echo   %TXT3%
echo   %TXT4%
echo   %TXT5%
echo   %TXT6%
echo   %TXT7%
echo.
echo   8. Tat tat ca
echo   9. Bat tat ca
echo   R. Quet lai cong mang [Sync trang thai]
echo   0. Thoat
echo.
echo ======================================================================
set "CHOICE="
set /p CHOICE="Nhap lua chon cua ban [0-9, R]: "

if "%CHOICE%"=="1" goto :TOGGLE_GATEWAY
if "%CHOICE%"=="2" goto :TOGGLE_AUTH
if "%CHOICE%"=="3" goto :TOGGLE_PRODUCT
if "%CHOICE%"=="4" goto :TOGGLE_WAREHOUSE
if "%CHOICE%"=="5" goto :TOGGLE_CUSTOMER
if "%CHOICE%"=="6" goto :TOGGLE_WMS_FE
if "%CHOICE%"=="7" goto :TOGGLE_STOREFRONT_FE
if "%CHOICE%"=="8" goto :ACTION_STOP_ALL
if "%CHOICE%"=="9" goto :ACTION_START_ALL
if /i "%CHOICE%"=="R" goto :ACTION_SYNC
if "%CHOICE%"=="0" goto :ACTION_EXIT

echo Lua chon khong hop le! Vui long nhap tu 0 den 9 hoac R.
timeout /t 1 > nul
goto :MENU

:TOGGLE_GATEWAY
if "%S1%"=="1" goto :STOP_GATEWAY
goto :START_GATEWAY
:STOP_GATEWAY
echo.
echo Dang tat API Gateway [Port 8080]...
taskkill /FI "WINDOWTITLE eq WMS - API Gateway (8080)*" /F /T > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a > nul 2>&1
)
set S1=0
echo [OK] Da tat API Gateway.
timeout /t 1 > nul
goto :MENU
:START_GATEWAY
echo.
echo Dang bat API Gateway [Port 8080]...
start "WMS - API Gateway (8080)" cmd /k "cd /d %~dp0api-gateway && .\mvnw.cmd spring-boot:run"
set S1=1
echo [OK] Da bat API Gateway.
timeout /t 1 > nul
goto :MENU

:TOGGLE_AUTH
if "%S2%"=="1" goto :STOP_AUTH
goto :START_AUTH
:STOP_AUTH
echo.
echo Dang tat Auth Service [Port 8081]...
taskkill /FI "WINDOWTITLE eq WMS - Auth Service (8081)*" /F /T > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :8081 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a > nul 2>&1
)
set S2=0
echo [OK] Da tat Auth Service.
timeout /t 1 > nul
goto :MENU
:START_AUTH
echo.
echo Dang bat Auth Service [Port 8081]...
start "WMS - Auth Service (8081)" cmd /k "cd /d %~dp0auth-service && .\mvnw.cmd spring-boot:run"
set S2=1
echo [OK] Da bat Auth Service.
timeout /t 1 > nul
goto :MENU

:TOGGLE_PRODUCT
if "%S3%"=="1" goto :STOP_PRODUCT
goto :START_PRODUCT
:STOP_PRODUCT
echo.
echo Dang tat Product Service [Port 8082]...
taskkill /FI "WINDOWTITLE eq WMS - Product Service (8082)*" /F /T > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :8082 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a > nul 2>&1
)
set S3=0
echo [OK] Da tat Product Service.
timeout /t 1 > nul
goto :MENU
:START_PRODUCT
echo.
echo Dang bat Product Service [Port 8082]...
start "WMS - Product Service (8082)" cmd /k "cd /d %~dp0product-service && .\mvnw.cmd spring-boot:run"
set S3=1
echo [OK] Da bat Product Service.
timeout /t 1 > nul
goto :MENU

:TOGGLE_WAREHOUSE
if "%S4%"=="1" goto :STOP_WAREHOUSE
goto :START_WAREHOUSE
:STOP_WAREHOUSE
echo.
echo Dang tat Warehouse Service [Port 8083]...
taskkill /FI "WINDOWTITLE eq WMS - Warehouse Service (8083)*" /F /T > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :8083 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a > nul 2>&1
)
set S4=0
echo [OK] Da tat Warehouse Service.
timeout /t 1 > nul
goto :MENU
:START_WAREHOUSE
echo.
echo Dang bat Warehouse Service [Port 8083]...
start "WMS - Warehouse Service (8083)" cmd /k "cd /d %~dp0warehouse-service && .\mvnw.cmd spring-boot:run"
set S4=1
echo [OK] Da bat Warehouse Service.
timeout /t 1 > nul
goto :MENU

:TOGGLE_CUSTOMER
if "%S5%"=="1" goto :STOP_CUSTOMER
goto :START_CUSTOMER
:STOP_CUSTOMER
echo.
echo Dang tat Customer Service [Port 8084]...
taskkill /FI "WINDOWTITLE eq WMS - Customer Service (8084)*" /F /T > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :8084 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a > nul 2>&1
)
set S5=0
echo [OK] Da tat Customer Service.
timeout /t 1 > nul
goto :MENU
:START_CUSTOMER
echo.
echo Dang bat Customer Service [Port 8084]...
start "WMS - Customer Service (8084)" cmd /k "cd /d %~dp0customer-service && .\mvnw.cmd spring-boot:run"
set S5=1
echo [OK] Da bat Customer Service.
timeout /t 1 > nul
goto :MENU

:TOGGLE_WMS_FE
if "%S6%"=="1" goto :STOP_WMS_FE
goto :START_WMS_FE
:STOP_WMS_FE
echo.
echo Dang tat WMS Frontend [Port 5173]...
taskkill /FI "WINDOWTITLE eq WMS - Frontend (5173)*" /F /T > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a > nul 2>&1
)
set S6=0
echo [OK] Da tat WMS Frontend.
timeout /t 1 > nul
goto :MENU
:START_WMS_FE
echo.
echo Dang bat WMS Frontend [Port 5173]...
start "WMS - Frontend (5173)" cmd /k "cd /d %~dp0crs-frontend && npm run dev"
set S6=1
echo [OK] Da bat WMS Frontend.
timeout /t 1 > nul
goto :MENU

:TOGGLE_STOREFRONT_FE
if "%S7%"=="1" goto :STOP_STOREFRONT_FE
goto :START_STOREFRONT_FE
:STOP_STOREFRONT_FE
echo.
echo Dang tat Storefront Frontend [Port 5174]...
taskkill /FI "WINDOWTITLE eq WMS - Storefront (5174)*" /F /T > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :5174 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a > nul 2>&1
)
set S7=0
echo [OK] Da tat Storefront Frontend.
timeout /t 1 > nul
goto :MENU
:START_STOREFRONT_FE
echo.
echo Dang bat Storefront Frontend [Port 5174]...
start "WMS - Storefront (5174)" cmd /k "cd /d %~dp0storefront-frontend && npm run dev"
set S7=1
echo [OK] Da bat Storefront Frontend.
timeout /t 1 > nul
goto :MENU

:ACTION_STOP_ALL
echo.
echo ========================================================
echo   DANG TAT TOAN BO CAC DICH VU WMS & STOREFRONT...
echo ========================================================

taskkill /FI "WINDOWTITLE eq WMS - API Gateway (8080)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Auth Service (8081)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Product Service (8082)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Warehouse Service (8083)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Customer Service (8084)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Frontend (5173)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Storefront (5174)*" /F /T > nul 2>&1

for %%p in (8080 8081 8082 8083 8084 5173 5174) do (
    for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :%%p ^| findstr LISTENING') do (
        echo Dang giai phong port %%p [PID %%a]...
        taskkill /F /T /PID %%a > nul 2>&1
    )
)

set S1=0
set S2=0
set S3=0
set S4=0
set S5=0
set S6=0
set S7=0

echo.
echo [OK] Da tat toan bo cac dich vu thanh cong!
timeout /t 2 > nul
goto :MENU

:ACTION_START_ALL
echo.
echo ========================================================
echo   DANG KHOI DONG CAC DICH VU DANG TAT...
echo ========================================================

if "%S2%"=="1" goto :CHECK_START_PROD
echo Dang khoi dong Auth Service [Cong 8081]...
start "WMS - Auth Service (8081)" cmd /k "cd /d %~dp0auth-service && .\mvnw.cmd spring-boot:run"
set S2=1
timeout /t 4 /nobreak > nul

:CHECK_START_PROD
if "%S3%"=="1" goto :CHECK_START_WH
echo Dang khoi dong Product Service [Cong 8082]...
start "WMS - Product Service (8082)" cmd /k "cd /d %~dp0product-service && .\mvnw.cmd spring-boot:run"
set S3=1
timeout /t 4 /nobreak > nul

:CHECK_START_WH
if "%S4%"=="1" goto :CHECK_START_CUST
echo Dang khoi dong Warehouse Service [Cong 8083]...
start "WMS - Warehouse Service (8083)" cmd /k "cd /d %~dp0warehouse-service && .\mvnw.cmd spring-boot:run"
set S4=1
timeout /t 4 /nobreak > nul

:CHECK_START_CUST
if "%S5%"=="1" goto :CHECK_START_GW
echo Dang khoi dong Customer Service [Cong 8084]...
start "WMS - Customer Service (8084)" cmd /k "cd /d %~dp0customer-service && .\mvnw.cmd spring-boot:run"
set S5=1
timeout /t 4 /nobreak > nul

:CHECK_START_GW
if "%S1%"=="1" goto :CHECK_START_WMS_FE
echo Dang khoi dong API Gateway [Cong 8080]...
start "WMS - API Gateway (8080)" cmd /k "cd /d %~dp0api-gateway && .\mvnw.cmd spring-boot:run"
set S1=1
timeout /t 4 /nobreak > nul

:CHECK_START_WMS_FE
if "%S6%"=="1" goto :CHECK_START_STOREFRONT_FE
echo Dang khoi dong WMS Frontend [Cong 5173]...
start "WMS - Frontend (5173)" cmd /k "cd /d %~dp0crs-frontend && npm run dev"
set S6=1
timeout /t 2 /nobreak > nul

:CHECK_START_STOREFRONT_FE
if "%S7%"=="1" goto :FINISH_START_ALL
echo Dang khoi dong Storefront Frontend [Cong 5174]...
start "WMS - Storefront (5174)" cmd /k "cd /d %~dp0storefront-frontend && npm run dev"
set S7=1
timeout /t 2 /nobreak > nul

:FINISH_START_ALL
echo.
echo [OK] Toan bo cac dich vu da duoc bat!
timeout /t 2 > nul
goto :MENU

:ACTION_SYNC
echo.
echo Dang kiem tra cac cong mang thuc te...
netstat -ano -p tcp | findstr LISTENING > "%TEMP%\wms_ports_check.txt"

findstr ":8080" "%TEMP%\wms_ports_check.txt" > nul 2>&1 && set "S1=1" || set "S1=0"
findstr ":8081" "%TEMP%\wms_ports_check.txt" > nul 2>&1 && set "S2=1" || set "S2=0"
findstr ":8082" "%TEMP%\wms_ports_check.txt" > nul 2>&1 && set "S3=1" || set "S3=0"
findstr ":8083" "%TEMP%\wms_ports_check.txt" > nul 2>&1 && set "S4=1" || set "S4=0"
findstr ":8084" "%TEMP%\wms_ports_check.txt" > nul 2>&1 && set "S5=1" || set "S5=0"
findstr ":5173" "%TEMP%\wms_ports_check.txt" > nul 2>&1 && set "S6=1" || set "S6=0"
findstr ":5174" "%TEMP%\wms_ports_check.txt" > nul 2>&1 && set "S7=1" || set "S7=0"

del "%TEMP%\wms_ports_check.txt" > nul 2>&1
echo [OK] Da dong bo xong trang thai tu he thong!
timeout /t 1 > nul
goto :MENU

:ACTION_EXIT
echo.
echo ========================================================
echo   LUA CHON THOAT
echo ========================================================
echo   [1] Thoat va TAT TOAN BO cac dich vu
echo   [2] Thoat nhung GIU NGUYEN cac dich vu dang chay
echo   [3] Quay lai Menu
echo ========================================================
set "EXIT_CHOICE="
set /p EXIT_CHOICE="Nhap lua chon [1/2/3]: "

if "%EXIT_CHOICE%"=="1" goto :STOP_AND_EXIT
if "%EXIT_CHOICE%"=="2" exit /b 0
if "%EXIT_CHOICE%"=="3" goto :MENU
echo Lua chon khong hop le!
timeout /t 1 > nul
goto :ACTION_EXIT

:STOP_AND_EXIT
echo.
echo Dang tat toan bo cac dich vu WMS & Storefront...
taskkill /FI "WINDOWTITLE eq WMS - API Gateway (8080)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Auth Service (8081)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Product Service (8082)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Warehouse Service (8083)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Customer Service (8084)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Frontend (5173)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Storefront (5174)*" /F /T > nul 2>&1
for %%p in (8080 8081 8082 8083 8084 5173 5174) do (
    for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :%%p ^| findstr LISTENING') do (
        taskkill /F /T /PID %%a > nul 2>&1
    )
)
echo [OK] Da tat toan bo cac dich vu. Tam biet!
timeout /t 1 > nul
exit /b 0

:STOP_ALL_CLI
echo Dang tat toan bo cac dich vu WMS [8080, 8081, 8082, 8083, 8084, 5173, 5174]...
taskkill /FI "WINDOWTITLE eq WMS - API Gateway (8080)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Auth Service (8081)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Product Service (8082)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Warehouse Service (8083)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Customer Service (8084)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Frontend (5173)*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq WMS - Storefront (5174)*" /F /T > nul 2>&1
for %%p in (8080 8081 8082 8083 8084 5173 5174) do (
    for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr :%%p ^| findstr LISTENING') do (
        echo Dang tat tien trinh PID %%a tren cong %%p...
        taskkill /F /T /PID %%a > nul 2>&1
    )
)
echo Da tat toan bo cac dich vu thanh cong!
exit /b 0
