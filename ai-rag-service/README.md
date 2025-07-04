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
```

## Uruchomienie

```bash
python app.py
```

Serwis będzie dostępny na `http://localhost:5000`

## Endpoints

- `POST /chat` - Główny endpoint do czatu z AI
- `GET /health` - Sprawdzenie stanu serwisu

## Struktura danych

Serwis automatycznie utworzy folder `chroma_db` do przechowywania pamięci długoterminowej.

## Funkcjonalności

- **Pamięć długoterminowa**: Każda postać AI pamięta poprzednie rozmowy z użytkownikiem
- **Wyszukiwanie semantyczne**: Wykorzystuje embeddingi do znajdowania odpowiednich wspomnień
- **Separacja użytkowników**: Każdy użytkownik ma oddzielną pamięć dla każdej postaci AI
- **Integracja z Google Gemini**: Wykorzystuje Google Gemini 1.5 Flash do generowania odpowiedzi
