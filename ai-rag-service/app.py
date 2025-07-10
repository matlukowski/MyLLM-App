# MONKEY PATCH to disable posthog telemetry in chromadb
try:
    import posthog
    def disabled_capture(*args, **kwargs):
        # This function does nothing, effectively disabling telemetry.
        pass
    posthog.capture = disabled_capture
    print("PostHog telemetry has been successfully disabled by monkey patch.")
except ImportError:
    print("PostHog not found, skipping telemetry patch.")
except Exception as e:
    print(f"Failed to apply PostHog telemetry patch: {e}")


import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
import google.generativeai as genai
import threading
import time

# Import dla OpenAI i Anthropic
try:
    import openai
except ImportError:
    openai = None
    print("OpenAI library nie jest zainstalowane")

try:
    import anthropic
except ImportError:
    anthropic = None
    print("Anthropic library nie jest zainstalowane")

load_dotenv()

# Inicjalizacja Flask
app = Flask(__name__)
CORS(app)

# Konfiguracja
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
CHROMA_DB_PATH = os.getenv('CHROMA_DB_PATH', './chroma_db')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))

# Inicjalizacja Google Gemini API (szybka operacja)
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    google_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    google_model = None
    print("Google API key nie został znaleziony w zmiennych środowiskowych")

# Globalne zmienne dla lazy loading
chroma_client = None
collection = None
embedding_function = None
_initialization_lock = threading.Lock()
_initialization_complete = False

def initialize_chroma_db():
    """
    Inicjalizuje ChromaDB i embedding function w tle
    """
    global chroma_client, collection, embedding_function, _initialization_complete
    
    try:
        print("Inicjalizacja ChromaDB...")
        start_time = time.time()
        
        # Inicjalizacja embedding function
        embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        
        # Inicjalizacja ChromaDB client
        chroma_client = chromadb.PersistentClient(
            path=CHROMA_DB_PATH,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Pobierz lub utwórz kolekcję
        try:
            collection = chroma_client.get_collection(
                name="ai_chat_memories",
                embedding_function=embedding_function
            )
        except:
            collection = chroma_client.create_collection(
                name="ai_chat_memories",
                embedding_function=embedding_function
            )
        
        _initialization_complete = True
        elapsed_time = time.time() - start_time
        print(f"ChromaDB zainicjalizowana w {elapsed_time:.2f} sekund")
        
    except Exception as e:
        print(f"Błąd podczas inicjalizacji ChromaDB: {e}")
        _initialization_complete = False

def ensure_chroma_initialized():
    """
    Zapewnia że ChromaDB jest zainicjalizowana przed użyciem
    """
    global _initialization_complete
    
    if not _initialization_complete:
        with _initialization_lock:
            if not _initialization_complete:
                initialize_chroma_db()
    
    if not _initialization_complete:
        raise Exception("ChromaDB nie została zainicjalizowana")

def save_memory_chunk(user_id: str, ai_char_id: str, text: str, interaction_id: str, message_type: str):
    """
    Zapisuje fragment pamięci do ChromaDB
    
    Args:
        user_id: ID użytkownika
        ai_char_id: ID postaci AI
        text: Tekst do zapisania
        interaction_id: Unikalny identyfikator interakcji
        message_type: 'user' lub 'ai'
    """
    try:
        ensure_chroma_initialized()
        
        document_id = f"{interaction_id}_{message_type}"
        
        collection.add(
            documents=[text],
            metadatas=[{
                "user_id": user_id,
                "ai_char_id": ai_char_id,
                "interaction_id": interaction_id,
                "message_type": message_type,
                "timestamp": datetime.now().isoformat()
            }],
            ids=[document_id]
        )
        print(f"Zapisano pamięć: {document_id}")
    except Exception as e:
        print(f"Błąd podczas zapisywania pamięci: {e}")

def retrieve_memory_chunks(user_id: str, ai_char_id: str, query_text: str, n_results: int = 5) -> List[str]:
    """
    Pobiera najbardziej podobne fragmenty pamięci z ChromaDB
    
    Args:
        user_id: ID użytkownika
        ai_char_id: ID postaci AI
        query_text: Tekst zapytania
        n_results: Liczba wyników do zwrócenia
        
    Returns:
        Lista fragmentów tekstu z pamięci
    """
    try:
        ensure_chroma_initialized()
        
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where={
                "$and": [
                    {"user_id": {"$eq": user_id}},
                    {"ai_char_id": {"$eq": ai_char_id}}
                ]
            }
        )
        
        if results['documents'] and len(results['documents']) > 0:
            return results['documents'][0]
        return []
    except Exception as e:
        print(f"Błąd podczas pobierania pamięci: {e}")
        return []

def get_ai_response(system_prompt: str, chat_history: List[Dict], user_message: str, provider: str, api_key: str, model_id: str) -> str:
    """
    Generuje odpowiedź przy użyciu odpowiedniego dostawcy AI
    
    Args:
        system_prompt: Prompt systemowy
        chat_history: Historia czatu (krótkoterminowa pamięć)
        user_message: Wiadomość użytkownika
        provider: Dostawca AI (google, openai, anthropic)
        api_key: Klucz API dla dostawcy
        model_id: ID modelu do użycia
        
    Returns:
        Odpowiedź AI jako string
    """
    try:
        if provider == "google":
            return get_gemini_response(system_prompt, chat_history, user_message, api_key, model_id)
        elif provider == "openai":
            return get_openai_response(system_prompt, chat_history, user_message, api_key, model_id)
        elif provider == "anthropic":
            return get_anthropic_response(system_prompt, chat_history, user_message, api_key, model_id)
        else:
            return f"Nieobsługiwany dostawca AI: {provider}"
    except Exception as e:
        print(f"Błąd podczas generowania odpowiedzi {provider}: {e}")
        return f"Przepraszam, wystąpił błąd podczas generowania odpowiedzi ({provider})."

def get_gemini_response(system_prompt: str, chat_history: List[Dict], user_message: str, api_key: str = None, model_id: str = None) -> str:
    """
    Generuje odpowiedź przy użyciu Google Gemini API
    """
    try:
        # Jeśli przekazano klucz API, użyj go
        if api_key:
            genai.configure(api_key=api_key)
            # Mapowanie modeli Gemini
            gemini_models = {
                "gemini-2.5-flash": "gemini-1.5-flash",
                "gemini-2.5-pro": "gemini-1.5-pro",
                "gemini-1.5-flash": "gemini-1.5-flash",
                "gemini-1.5-pro": "gemini-1.5-pro"
            }
            model_name = gemini_models.get(model_id, "gemini-1.5-flash")
            model = genai.GenerativeModel(model_name)
        else:
            model = google_model
            
        if not model:
            return "Google Gemini API nie jest dostępny - brak klucza API."
        
        # Budowanie listy wiadomości
        messages = []
        
        # Dodaj system prompt jako pierwszą wiadomość
        messages.append(f"System: {system_prompt}")
        
        # Dodaj historię czatu
        for msg in chat_history:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'user':
                messages.append(f"User: {content}")
            else:
                messages.append(f"Assistant: {content}")
        
        # Dodaj aktualną wiadomość użytkownika
        messages.append(f"User: {user_message}")
        
        # Połącz wszystkie wiadomości
        full_prompt = "\n".join(messages)
        
        # Generuj odpowiedź
        response = model.generate_content(full_prompt)
        
        return response.text if response.text else "Przepraszam, nie mogę wygenerować odpowiedzi."
        
    except Exception as e:
        print(f"Błąd podczas generowania odpowiedzi Gemini: {e}")
        return "Przepraszam, wystąpił błąd podczas generowania odpowiedzi z Google Gemini."

def get_openai_response(system_prompt: str, chat_history: List[Dict], user_message: str, api_key: str, model_id: str) -> str:
    """
    Generuje odpowiedź przy użyciu OpenAI API
    """
    try:
        if not openai:
            return "OpenAI library nie jest zainstalowana. Zainstaluj: pip install openai"
        
        # Inicjalizuj klienta OpenAI z przekazanym kluczem
        client = openai.OpenAI(api_key=api_key)
        
        # Budowanie listy wiadomości dla OpenAI
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Dodaj historię czatu
        for msg in chat_history:
            role = msg.get('role', 'user')
            if role == 'model':  # Gemini używa 'model', OpenAI używa 'assistant'
                role = 'assistant'
            content = msg.get('content', '')
            messages.append({"role": role, "content": content})
        
        # Dodaj aktualną wiadomość użytkownika
        messages.append({"role": "user", "content": user_message})
        
        # Mapowanie ID modelu na nazwę modelu OpenAI
        model_mapping = {
            "gpt-4.1": "gpt-4",
            "gpt-4": "gpt-4",
            "gpt-3.5-turbo": "gpt-3.5-turbo"
        }
        openai_model = model_mapping.get(model_id, "gpt-4")  # Domyślnie gpt-4
        
        # Generuj odpowiedź
        response = client.chat.completions.create(
            model=openai_model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.choices[0].message.content or "Przepraszam, nie mogę wygenerować odpowiedzi."
        
    except Exception as e:
        print(f"Błąd podczas generowania odpowiedzi OpenAI: {e}")
        return f"Przepraszam, wystąpił błąd podczas generowania odpowiedzi z OpenAI: {str(e)}"

def get_anthropic_response(system_prompt: str, chat_history: List[Dict], user_message: str, api_key: str, model_id: str) -> str:
    """
    Generuje odpowiedź przy użyciu Anthropic Claude API
    """
    try:
        if not anthropic:
            return "Anthropic library nie jest zainstalowana. Zainstaluj: pip install anthropic"
        
        # Inicjalizuj klienta Anthropic z przekazanym kluczem
        client = anthropic.Anthropic(api_key=api_key)
        
        # Budowanie listy wiadomości dla Claude
        messages = []
        
        # Dodaj historię czatu
        for msg in chat_history:
            role = msg.get('role', 'user')
            if role == 'model':  # Gemini używa 'model', Claude używa 'assistant'
                role = 'assistant'
            content = msg.get('content', '')
            messages.append({"role": role, "content": content})
        
        # Dodaj aktualną wiadomość użytkownika
        messages.append({"role": "user", "content": user_message})
        
        # Mapowanie ID modelu na nazwę modelu Claude
        model_mapping = {
            "claude-sonnet-4-20250514": "claude-3-5-sonnet-20241022",
            "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
            "claude-3-haiku": "claude-3-haiku-20240307"
        }
        claude_model = model_mapping.get(model_id, "claude-3-5-sonnet-20241022")  # Domyślnie claude sonnet
        
        # Generuj odpowiedź
        response = client.messages.create(
            model=claude_model,
            system=system_prompt,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.content[0].text if response.content else "Przepraszam, nie mogę wygenerować odpowiedzi."
        
    except Exception as e:
        print(f"Błąd podczas generowania odpowiedzi Claude: {e}")
        return f"Przepraszam, wystąpił błąd podczas generowania odpowiedzi z Claude: {str(e)}"

@app.route('/chat', methods=['POST'])
def chat():
    """
    Endpoint do obsługi czatu z pamięcią długoterminową
    """
    try:
        data = request.get_json()
        
        # Pobierz dane z żądania
        user_id = data.get('userId')
        ai_char_id = data.get('aiCharId')
        user_message = data.get('userMessage')
        chat_history = data.get('chatHistory', [])
        character_prompt = data.get('characterPrompt', '')
        api_key = data.get('apiKey')
        provider = data.get('provider', 'google')  # Domyślnie Google
        
        # Walidacja danych
        if not all([user_id, ai_char_id, user_message]):
            return jsonify({'error': 'Brakuje wymaganych danych'}), 400
            
        if not api_key:
            return jsonify({'error': f'Brak klucza API dla dostawcy {provider}'}), 400
        
        # Pobierz odpowiednie wspomnienia z pamięci długoterminowej
        relevant_memories = retrieve_memory_chunks(
            user_id=user_id,
            ai_char_id=ai_char_id,
            query_text=user_message,
            n_results=5
        )
        
        # Zbuduj końcowy system prompt z pamięcią długoterminową
        memory_context = ""
        if relevant_memories:
            memory_context = "\n\nOdpowiednie wspomnienia z poprzednich rozmów:\n" + "\n".join([f"- {memory}" for memory in relevant_memories])
        
        final_system_prompt = character_prompt + memory_context
        
        # Generuj odpowiedź AI przy użyciu odpowiedniego dostawcy
        ai_response = get_ai_response(
            system_prompt=final_system_prompt,
            chat_history=chat_history,
            user_message=user_message,
            provider=provider,
            api_key=api_key,
            model_id=ai_char_id  # Używamy ai_char_id jako model_id
        )
        
        # Zapisz wiadomość użytkownika i odpowiedź AI do pamięci długoterminowej
        interaction_id = str(uuid.uuid4())
        
        save_memory_chunk(
            user_id=user_id,
            ai_char_id=ai_char_id,
            text=user_message,
            interaction_id=interaction_id,
            message_type='user'
        )
        
        save_memory_chunk(
            user_id=user_id,
            ai_char_id=ai_char_id,
            text=ai_response,
            interaction_id=interaction_id,
            message_type='ai'
        )
        
        return jsonify({
            'response': ai_response,
            'memories_used': len(relevant_memories),
            'provider': provider
        })
        
    except Exception as e:
        print(f"Błąd w endpoint /chat: {e}")
        return jsonify({'error': 'Wystąpił błąd serwera'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Endpoint do sprawdzenia stanu serwisu"""
    status = 'healthy' if _initialization_complete else 'initializing'
    return jsonify({
        'status': status, 
        'service': 'AI RAG Service',
        'chroma_ready': _initialization_complete
    })

@app.route('/status', methods=['GET'])
def status():
    """Endpoint do sprawdzenia szczegółowego stanu inicjalizacji"""
    return jsonify({
        'chroma_initialized': _initialization_complete,
        'service': 'AI RAG Service'
    })

if __name__ == '__main__':
    print(f"Uruchamianie serwisu RAG na porcie {FLASK_PORT}")
    print(f"ChromaDB path: {CHROMA_DB_PATH}")
    print("Serwis uruchamia się natychmiast, ChromaDB inicjalizuje się w tle...")
    
    # Uruchom inicjalizację ChromaDB w tle
    init_thread = threading.Thread(target=initialize_chroma_db, daemon=True)
    init_thread.start()
    
    app.run(host='0.0.0.0', port=FLASK_PORT, debug=True) 