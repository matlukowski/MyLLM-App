#!/usr/bin/env python3
"""
Skrypt startowy dla serwisu RAG z monitorowaniem inicjalizacji
"""

import os
import sys
import time
import threading
import requests
from datetime import datetime

def check_service_status(port=5000, max_retries=30):
    """
    Sprawdza status serwisu i monitoruje inicjalizację
    """
    print("Monitorowanie inicjalizacji serwisu RAG...")
    
    for i in range(max_retries):
        try:
            response = requests.get(f'http://localhost:{port}/status', timeout=2)
            if response.status_code == 200:
                data = response.json()
                if data.get('chroma_initialized', False):
                    print("Serwis RAG w pelni zainicjalizowany!")
                    print(f"Dostepny pod adresem: http://localhost:{port}")
                    print(f"Health check: http://localhost:{port}/health")
                    return True
                else:
                    print(f"Inicjalizacja ChromaDB w toku... ({i+1}/{max_retries})")
            else:
                print(f"Czekam na serwis... ({i+1}/{max_retries})")
        except requests.exceptions.RequestException:
            print(f"Uruchamianie serwisu... ({i+1}/{max_retries})")
        
        time.sleep(1)
    
    print("Timeout - serwis nie zostal w pelni zainicjalizowany w oczekiwanym czasie")
    return False

def main():
    """
    Główna funkcja startowa
    """
    print("=" * 60)
    print("URUCHAMIANIE SERWISU RAG")
    print("=" * 60)
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Sprawdź czy plik app.py istnieje
    if not os.path.exists('app.py'):
        print("Blad: Nie znaleziono pliku app.py")
        print("Upewnij sie, ze uruchamiasz skrypt z katalogu ai-rag-service")
        sys.exit(1)
    
    # Sprawdź czy .env istnieje
    if not os.path.exists('.env'):
        print("Ostrzezenie: Nie znaleziono pliku .env")
        print("Upewnij sie, ze masz skonfigurowane zmienne srodowiskowe")
    
    print("Informacje o konfiguracji:")
    print(f"   - CHROMA_DB_PATH: {os.getenv('CHROMA_DB_PATH', './chroma_db')}")
    print(f"   - FLASK_PORT: {os.getenv('FLASK_PORT', '5000')}")
    print()
    
    # Uruchom serwis w tle
    print("Uruchamianie serwisu Flask...")
    os.system('python app.py &')
    
    # Monitoruj inicjalizację
    time.sleep(2)  # Daj czas na uruchomienie Flask
    success = check_service_status(port=int(os.getenv('FLASK_PORT', 5000)))
    
    if success:
        print()
        print("Serwis RAG gotowy do pracy!")
        print("Uzyj Ctrl+C aby zatrzymac serwis")
        
        # Pozostań aktywny
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nZatrzymywanie serwisu...")
    else:
        print("Nie udalo sie uruchomic serwisu")
        sys.exit(1)

if __name__ == '__main__':
    main() 