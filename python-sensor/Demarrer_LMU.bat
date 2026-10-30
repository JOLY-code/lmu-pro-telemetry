@echo off
title LMU Track Engineer Launcher
color 0B

echo ===================================================
echo      ALLUMAGE DES SYSTEMES - LMU TRACK ENGINEER
echo ===================================================
echo.

:: 1. Démarrer le Backend Python (Sonde + IA + Spotter)
echo [1/2] Lancement du Cerveau Python (Backend)...
:: Assure-toi que ce script .bat est dans le meme dossier que tes fichiers Python.
start "LMU Backend" cmd /k "python api_server.py"

:: Attendre 3 secondes pour laisser l'API et les ports se preparer
timeout /t 3 /nobreak > NUL

:: 2. Démarrer le Frontend React (Interface)
echo [2/2] Lancement de l'Interface React (Frontend)...
:: /!\ ATTENTION : Si ton code React (package.json) est dans un sous-dossier, modifie la ligne CD ci-dessous.
:: Par exemple, si ton dossier React s'appelle "frontend", supprime les :: de la ligne suivante :
cd ..
cd lmu-frontend

start "LMU Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   Systeme operationnel. Bon roulage Matheo !
echo ===================================================
timeout /t 5 > NUL