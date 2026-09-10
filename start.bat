@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Симуляторы курса АКС / АФС
echo  Браузер: http://127.0.0.1:8765/simulators.html
echo  Не открывайте HTML двойным щелчком — модули так не грузятся.
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:8765/simulators.html#workflow'"
python -m http.server 8765 --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo  Python не найден или порт 8765 занят.
  echo  Если страница уже открылась — сервер, скорее всего, уже запущен.
  echo  Иначе поставьте Python с python.org и отметьте Add python.exe to PATH.
  pause
)
