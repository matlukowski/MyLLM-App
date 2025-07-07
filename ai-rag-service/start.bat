@echo off
echo ============================================================
echo URUCHAMIANIE SERWISU RAG
echo ============================================================
echo.

REM Sprawdź czy istnieje środowisko wirtualne
if exist "venv\Scripts\activate.bat" (
    echo Aktywacja srodowiska wirtualnego...
    call venv\Scripts\activate.bat
) else (
    echo Ostrzezenie: Nie znaleziono srodowiska wirtualnego
)

REM Sprawdź czy istnieje plik .env
if not exist ".env" (
    echo Ostrzezenie: Nie znaleziono pliku .env
    echo Skopiuj .env.example do .env i skonfiguruj
)

echo Uruchamianie serwisu z monitorowaniem...
python start.py

pause 