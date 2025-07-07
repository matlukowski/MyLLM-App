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

load_dotenv()

# Inicjalizacja Flask
app = Flask(__name__)
CORS(app)

# Konfiguracja
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
CHROMA_DB_PATH = os.getenv('CHROMA_DB_PATH', './chroma_db')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))

# Inicjalizacja Google Gemini API (szybka operacja)
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

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

def get_gemini_response(system_prompt: str, chat_history: List[Dict], user_message: str) -> str:
    """
    Generuje odpowiedź przy użyciu Google Gemini API
    
    Args:
        system_prompt: Prompt systemowy
        chat_history: Historia czatu (krótkoterminowa pamięć)
        user_message: Wiadomość użytkownika
        
    Returns:
        Odpowiedź AI jako string
    """
    try:
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
        return "Przepraszam, wystąpił błąd podczas generowania odpowiedzi."

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
        
        # Walidacja danych
        if not all([user_id, ai_char_id, user_message]):
            return jsonify({'error': 'Brakuje wymaganych danych'}), 400
        
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
        
        # Generuj odpowiedź AI
        ai_response = get_gemini_response(
            system_prompt=final_system_prompt,
            chat_history=chat_history,
            user_message=user_message
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
            'memories_used': len(relevant_memories)
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