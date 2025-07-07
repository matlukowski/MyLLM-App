# AI RAG Service

Serwis pamięci długoterminowej dla postaci AI oparty na architekturze RAG (Retrieval-Augmented Generation).

## Wymagania

- Python 3.8+
- Google Gemini API Key

## Instalacja

1. Utwórz i aktywuj wirtualne środowisko:

```bash
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate
```

2. Zainstaluj zależności:

```bash
pip install -r requirements.txt
```

3. Skonfiguruj zmienne środowiskowe w pliku `.env`:

```
GOOGLE_API_KEY=TWOJ_KLUCZ_API_GEMINI
CHROMA_DB_PATH=./chroma_db
FLASK_PORT=5000
```

Możesz skopiować `.env.example` jako punkt startowy.

## Uruchomienie

### Szybkie uruchomienie (zalecane)

**Windows:**

```bash
start.bat
```

**Linux/Mac:**

```bash
python start.py
```

### Tradycyjne uruchomienie

```bash
python app.py
```

## Optymalizacje wydajności

Serwis został zoptymalizowany pod kątem szybkiego uruchamiania:

- **Lazy loading**: ChromaDB i modele sentence-transformers ładują się w tle
- **Natychmiastowy start**: Flask uruchamia się od razu, bez czekania na pełną inicjalizację
- **Monitoring statusu**: Sprawdzanie postępu inicjalizacji w czasie rzeczywistym
- **Wielowątkowość**: Inicjalizacja odbywa się w osobnym wątku

Serwis będzie dostępny na `http://localhost:5000`

## Endpoints

- `POST /chat` - Główny endpoint do czatu z AI
- `GET /health` - Sprawdzenie stanu serwisu (z informacją o gotowości ChromaDB)
- `GET /status` - Szczegółowy status inicjalizacji komponentów

## Status inicjalizacji

Po uruchomieniu możesz sprawdzić status:

```bash
curl http://localhost:5000/status
```

Odpowiedź:

```json
{
  "chroma_initialized": true,
  "service": "AI RAG Service"
}
```

## Struktura danych

Serwis automatycznie utworzy folder `chroma_db` do przechowywania pamięci długoterminowej.

## Funkcjonalności

- **Pamięć długoterminowa**: Każda postać AI pamięta poprzednie rozmowy z użytkownikiem
- **Wyszukiwanie semantyczne**: Wykorzystuje embeddingi do znajdowania odpowiednich wspomnień
- **Separacja użytkowników**: Każdy użytkownik ma oddzielną pamięć dla każdej postaci AI
- **Integracja z Google Gemini**: Wykorzystuje Google Gemini 1.5 Flash do generowania odpowiedzi
- **Asynchroniczna inicjalizacja**: Serwis uruchamia się natychmiast, komponenty ładują się w tle

## Troubleshooting

### Długie uruchamianie

Jeśli serwis nadal uruchamia się długo:

1. Sprawdź połączenie internetowe (pobieranie modeli sentence-transformers)
2. Upewnij się, że masz wystarczająco miejsca na dysku dla ChromaDB
3. Sprawdź logi w konsoli podczas inicjalizacji

### Brak odpowiedzi na `/chat`

Jeśli endpoint `/chat` nie działa:

1. Sprawdź status przez `/status` endpoint
2. Poczekaj na pełną inicjalizację ChromaDB
3. Sprawdź czy `GOOGLE_API_KEY` jest poprawnie skonfigurowany
