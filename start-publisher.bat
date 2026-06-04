@echo off
cd /d "%~dp0"
python .\publisher_app\server.py --port 8767
