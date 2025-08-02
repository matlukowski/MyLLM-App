# MyLLM Chat

**Nowoczesna aplikacja czatowa z AI** - alternatywa dla ChatGPT, Gemini i Claude z możliwością używania własnych kluczy API zamiast płacenia abonamentów.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405e?style=for-the-badge&logo=sqlite&logoColor=white)

## 📥 Pobierz aplikację desktop

### Najnowsza wersja: [Releases](https://github.com/your-username/myllm-chat/releases)

#### Windows 🪟
- **[📦 MyLLM-Chat-Setup.exe](https://github.com/your-username/myllm-chat/releases/latest)** - Installer NSIS
- **[📦 MyLLM-Chat.msi](https://github.com/your-username/myllm-chat/releases/latest)** - Installer MSI
- **Wymagania**: Windows 10/11 (64-bit)

#### macOS 🍎  
- **[📦 MyLLM-Chat.dmg](https://github.com/your-username/myllm-chat/releases/latest)** - Disk Image
- **[📦 MyLLM-Chat.pkg](https://github.com/your-username/myllm-chat/releases/latest)** - Package Installer
- **Wymagania**: macOS 10.15+ (Intel/Apple Silicon)

#### Linux 🐧
- **[📦 MyLLM-Chat.AppImage](https://github.com/your-username/myllm-chat/releases/latest)** - Portable AppImage
- **[📦 MyLLM-Chat.deb](https://github.com/your-username/myllm-chat/releases/latest)** - Debian/Ubuntu Package
- **Wymagania**: Ubuntu 18.04+ / Debian 10+

### 🚀 Szybki start
1. Pobierz installer dla swojego systemu
2. Uruchom plik i postępuj zgodnie z instrukcjami
3. Otwórz aplikację i skonfiguruj klucze API
4. Rozpocznij chatowanie z AI!

### 📱 Instalacja

#### Windows 🪟
1. Pobierz `.exe` lub `.msi` z [Releases](https://github.com/your-username/myllm-chat/releases)
2. Uruchom installer jako administrator (jeśli Windows wymaga)
3. Jeśli Windows SmartScreen zablokuje: kliknij "More info" → "Run anyway"
4. Postępuj zgodnie z kreatorem instalacji

#### macOS 🍎
1. Pobierz `.dmg` z [Releases](https://github.com/your-username/myllm-chat/releases)
2. Otwórz plik `.dmg` i przeciągnij MyLLM Chat do Applications
3. Przy pierwszym uruchomieniu: kliknij prawym → "Open" (obejście Gatekeeper)
4. Lub w System Preferences → Security → "Open Anyway"

#### Linux 🐧
**AppImage (zalecane)**:
```bash
chmod +x MyLLM-Chat-*.AppImage
./MyLLM-Chat-*.AppImage
```

**Debian/Ubuntu**:
```bash
sudo dpkg -i MyLLM-Chat_*.deb
sudo apt-get install -f  # jeśli brakuje zależności
```

## 📖 Opis projektu

MyLLM Chat to nowoczesna aplikacja webowa umożliwiająca konwersacje z różnymi modelami AI. Projekt powstał jako alternatywa dla popularnych chatbotów AI (ChatGPT, Gemini, Claude), z kluczową różnicą - **używasz własnych kluczy API** zamiast płacenia miesięcznych abonamentów.

### 🎯 Główne cele projektu

- **Oszczędność** - płacisz tylko za rzeczywiste użycie API
- **Prywatność** - klucze API przechowywane lokalnie w przeglądarce
- **Elastyczność** - wybór spośród różnych modeli AI w jednym miejscu
- **Nowoczesność** - responsywny design i intuicyjny interfejs

## ✨ Funkcjonalności

### 🤖 Modele AI

- **Google Gemini** (2.5 Flash, 2.5 Pro)
- **OpenAI GPT** (GPT-4.1)
- **Anthropic Claude** (Claude 4 Sonnet)
- Łatwe przełączanie między modelami w trakcie konwersacji

### 💬 Zarządzanie czatami

- Tworzenie i usuwanie rozmów
- Historia wszystkich konwersacji
- Automatyczne generowanie tytułów czatów
- Sidebar z listą ostatnich rozmów

### 🧠 Pamięć wektorowa (NOWOŚĆ!)

- **Inteligentna pamięć między rozmowami** - AI pamięta informacje z poprzednich czatów
- **Semantyczne wyszukiwanie** - znajdowanie podobnych tematów z historii
- **Automatyczna ocena ważności** - zapisywanie tylko istotnych informacji
- **Inteligentna analiza intencji** - rozróżnianie kontynuacji tematu od odwołań do przeszłości
- **Konfigurowane ustawienia prywatności** - pełna kontrola nad tym co jest zapisywane
- **Tryb incognito** - rozmowy bez zapisywania do pamięci

### 📎 Obsługa plików

- Przesyłanie i analiza dokumentów (PDF, DOCX, XLSX)
- Obsługa obrazów (JPEG, PNG, GIF, WebP)
- Pliki tekstowe (TXT, CSV, JSON)
- Maksymalny rozmiar pliku: 10MB

### 🔐 Bezpieczeństwo

- System rejestracji i logowania
- Hashowanie haseł (bcrypt)
- Lokalne przechowywanie kluczy API
- Ochrona tras przed nieautoryzowanym dostępem

### 🎨 Interfejs użytkownika

- Responsywny design (desktop + mobile)
- Ciemny sidebar z jasnymi okienkami czatu
- Markdown rendering z podświetlaniem składni
- Animacje i smooth scrolling
- Toast notifications

## 🛠️ Technologie

### Frontend

- **React 19** - nowoczesna biblioteka UI
- **TypeScript** - statyczne typowanie
- **Vite** - szybki bundler
- **Chakra UI v3** - komponenty UI
- **React Router v7** - routing
- **React Markdown** - renderowanie markdown z KaTeX i syntax highlighting
- **React Toastify** - notyfikacje
- **Tailwind CSS** - stylowanie

### Backend

- **Node.js** - środowisko runtime
- **Express** - framework webowy
- **TypeScript** - statyczne typowanie
- **Prisma** - ORM i migracje bazy danych
- **PostgreSQL** - baza danych
- **bcrypt** - hashowanie haseł
- **Multer** - obsługa plików
- **CORS** - obsługa cross-origin requests

### Integracje AI

- **@google/generative-ai** - Google Gemini
- **openai** - OpenAI GPT
- **@anthropic-ai/sdk** - Anthropic Claude
- **@xenova/transformers** - lokalne generowanie embeddings dla pamięci wektorowej

### Obsługa plików

- **pdf-parse** - parsowanie PDF
- **mammoth** - konwersja DOCX
- **xlsx** - obsługa arkuszy Excel

## 🚀 Instalacja i uruchomienie

### Wymagania systemowe

- **Node.js** 18+
- **npm** lub **yarn**
- **PostgreSQL** 12+

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/twoje-username/myllm-chat.git
cd myllm-chat
```

### 2. Instalacja zależności

```bash
# Instalacja dla całego projektu (workspace)
npm install

# Lub osobno dla każdego modułu
cd client && npm install
cd ../server && npm install
```

### 3. Konfiguracja bazy danych

#### Utwórz bazę PostgreSQL

```sql
CREATE DATABASE myllm_chat;
CREATE USER myllm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE myllm_chat TO myllm_user;
```

#### Skonfiguruj zmienną środowiskową

Utwórz plik `server/.env`:

```env
DATABASE_URL="postgresql://myllm_user:your_password@localhost:5432/myllm_chat"
```

### 4. Migracja bazy danych

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 5. Uruchomienie aplikacji

#### Opcja 1: Wszystko naraz (zalecane)

```bash
# Z głównego katalogu
npm run dev
```

#### Opcja 2: Osobno

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 6. Dostęp do aplikacji

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 🖥️ Budowanie aplikacji desktop

### Wymagania dla budowania
- **Node.js** 18+
- **npm** 8+
- **Wszystkie zależności** zainstalowane (root + workspaces)

### Szybkie budowanie

#### Windows (.exe + .msi)
```bash
npm run release:build:win
```

#### macOS (.dmg + .pkg)  
```bash
npm run release:build:mac
```

#### Linux (.AppImage + .deb)
```bash
npm run release:build:linux
```

#### Wszystkie platformy
```bash
npm run release:build:all
```

### Pliki wyjściowe
Wszystkie zbudowane instalatory znajdziesz w: `electron/release/`

### Czyszczenie przed buildem
```bash
npm run release:clean
npm run release:test
```

### Workflow manual release
1. **Przygotuj wersję**:
   ```bash
   npm run release:clean
   npm run release:test
   ```

2. **Zbuduj instalatory**:
   ```bash
   npm run release:build:all
   ```

3. **Sprawdź wyniki** w `electron/release/`:
   - `MyLLM-Chat-Setup-1.0.0.exe` (Windows NSIS)
   - `MyLLM-Chat-1.0.0.msi` (Windows MSI)
   - `MyLLM-Chat-1.0.0.dmg` (macOS)
   - `MyLLM-Chat-1.0.0.pkg` (macOS)
   - `MyLLM-Chat-1.0.0.AppImage` (Linux)
   - `MyLLM-Chat_1.0.0_amd64.deb` (Linux)

4. **Utwórz GitHub Release**:
   - Idź na GitHub → Releases → "Create new release"
   - Tag: `v1.0.0` (nowa wersja)
   - Tytuł: `MyLLM Chat v1.0.0`
   - Opis: Opisz zmiany w tej wersji
   - Załącz wszystkie pliki z `electron/release/`
   - Kliknij "Publish release"

### Troubleshooting budowania

#### Windows
- Zainstaluj **Windows Build Tools**: `npm install -g windows-build-tools`
- Może potrzebować **Visual Studio Build Tools**

#### macOS  
- Zainstaluj **Xcode Command Line Tools**: `xcode-select --install`
- Może potrzebować **Apple Developer Certificate** do signing

#### Linux
- Zainstaluj pakiety build: `sudo apt-get install build-essential libnss3-dev libatk-bridge2.0-dev libgtk-3-dev libxss1`

## 🔑 Konfiguracja kluczy API

Po uruchomieniu aplikacji:

1. **Zarejestruj się** lub zaloguj w aplikacji
2. **Kliknij ikonę koła zębatego** w sidebarze
3. **Dodaj klucze API** dla wybranych dostawców:

### Google Gemini

- Przejdź do [Google Cloud Console](https://console.cloud.google.com)
- Włącz Generative AI API
- Utwórz klucz API
- Format: `AIza...`

### OpenAI

- Przejdź do [OpenAI Platform](https://platform.openai.com/api-keys)
- Utwórz nowy klucz API
- Format: `sk-...`

### Anthropic Claude

- Przejdź do [Anthropic Console](https://console.anthropic.com)
- Utwórz klucz API
- Format: `sk-ant-...`

## 📁 Struktura projektu

```
myllm-chat/
├── client/                 # Aplikacja React
│   ├── src/
│   │   ├── components/     # Komponenty React
│   │   │   ├── chatpage/   # Komponenty czatu
│   │   │   ├── pages/      # Strony (Auth)
│   │   │   └── ui/         # Komponenty UI
│   │   ├── contexts/       # React Context (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   └── types/          # Definicje TypeScript
│   ├── public/            # Statyczne pliki
│   └── package.json
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── services/      # Serwisy (pamięć wektorowa, analiza intencji)
│   │   │   ├── VectorMemoryService.ts    # Główny serwis pamięci
│   │   │   ├── EmbeddingsService.ts      # Generowanie embeddings
│   │   │   ├── ImportanceScorer.ts       # Ocena ważności wiadomości
│   │   │   └── IntentAnalyzer.ts         # Analiza intencji użytkownika
│   │   ├── utils/         # Utilities (obsługa plików)
│   │   └── server.ts      # Główny plik serwera
│   ├── prisma/            # Schema i migracje bazy
│   ├── uploads/           # Przesłane pliki
│   └── package.json
└── package.json          # Workspace config
```

## 🎮 Jak używać

### Rozpoczęcie nowej rozmowy

1. Kliknij **"Nowa rozmowa"** w sidebarze
2. Wybierz model AI z listy rozwijanej
3. Napisz wiadomość i wyślij

### Przesyłanie plików

1. Kliknij ikonę **📎** obok pola tekstowego
2. Wybierz pliki (maks. 10MB każdy)
3. Wyślij wiadomość - AI przeanalizuje załączniki

### Zarządzanie rozmowami

- **Usuwanie**: Najedź na czat w sidebarze i kliknij ikonę kosza
- **Kopiowanie**: Kliknij "Kopiuj" przy każdej wiadomości  
- **Zmiana modelu**: Użyj listy rozwijanej w obszarze czatu

### 🧠 Konfiguracja pamięci wektorowej

1. **Ustawienia podstawowe** - dostęp przez API `GET/PUT /api/memory/settings/:userId`
2. **Poziomy agresywności pamięci**:
   - `conservative` (domyślny) - pamięć tylko przy wyraźnych odwołaniach
   - `moderate` - pamięć przy dwuznacznych sytuacjach
   - `aggressive` - pamięć zawsze aktywna
3. **Opcje prywatności**:
   - Wyłączenie pamięci (`memoryEnabled: false`)
   - Tryb incognito (`incognitoMode: true`)
   - Ograniczenie do pojedynczych czatów (`shareMemoryAcrossChats: false`)

### 📊 API pamięci wektorowej

- `POST /api/memory/search` - wyszukiwanie w pamięci
- `DELETE /api/memory/cleanup/:userId` - czyszczenie starych wpisów
- `DELETE /api/memory/chat/:chatId` - usuwanie pamięci czatu
- `GET /api/memory/stats/:userId` - statystyki pamięci
- `POST /api/memory/validate/:userId` - weryfikacja spójności

## 🐛 Rozwiązywanie problemów

### Problemy z aplikacją desktop 🖥️

#### Windows
**Windows SmartScreen blokuje aplikację**
1. Kliknij "More info" 
2. Kliknij "Run anyway"
3. Lub wyłącz SmartScreen tymczasowo w Windows Defender

**Aplikacja nie startuje**
1. Uruchom jako administrator
2. Sprawdź czy masz .NET Framework 4.7.2+
3. Sprawdź logi w Event Viewer

**Antywirus usuwa aplikację**
1. Dodaj folder aplikacji do exclusions
2. Pobierz ponownie z GitHub Releases

#### macOS
**"Application can't be opened" (Gatekeeper)**
1. Kliknij prawym na aplikację → "Open"
2. Lub w System Preferences → Security → "Open Anyway"
3. Lub wyłącz Gatekeeper: `sudo spctl --master-disable`

**Aplikacja crashuje przy starcie**
1. Sprawdź czy masz macOS 10.15+
2. Sprawdź Console.app dla błędów
3. Spróbuj wersji x64 vs arm64

#### Linux
**AppImage nie uruchamia się**
```bash
chmod +x MyLLM-Chat-*.AppImage
./MyLLM-Chat-*.AppImage
```

**Brakuje bibliotek (Ubuntu/Debian)**
```bash
sudo apt-get install libgtk-3-0 libxss1 libnss3 libgconf-2-4
```

**Problem z permissions**
```bash
sudo chmod +x MyLLM-Chat-*.AppImage
sudo chown $USER:$USER MyLLM-Chat-*.AppImage
```

### Problemy z developmentem 💻

#### Problem z bazą danych
```bash
cd server
npx prisma db push
npx prisma generate
```

#### Problem z pamięcią wektorową
```bash
# Jeśli pamięć wektorowa nie działa, sprawdź inicjalizację
# Model embeddings pobiera się przy pierwszym uruchomieniu (~50MB)
# Sprawdź logi serwera w poszukiwaniu błędów inicjalizacji

# Weryfikacja spójności pamięci
curl -X POST http://localhost:3001/api/memory/validate/USER_ID

# Statystyki pamięci
curl http://localhost:3001/api/memory/stats/USER_ID
```

#### Problem z TypeScript
```bash
# Client
cd client
npm run build

# Server
cd server
npm run build
```

#### Problemy z portami
- Zmień porty w `client/vite.config.ts` i `server/src/server.ts`
- Upewnij się, że porty 3001 i 5173 są wolne

#### Build aplikacji desktop nie działa
```bash
# Wyczyść wszystko
npm run release:clean
rm -rf node_modules */node_modules

# Reinstall
npm install

# Test build
npm run release:test
npm run release:build:win
```

### FAQ 🙋‍♂️

**Q: Czy aplikacja wymaga internetu?**
A: Tak, do komunikacji z API dostawców AI (OpenAI, Google, Anthropic).

**Q: Gdzie są przechowywane dane?**
A: Lokalnie w SQLite database w folderze aplikacji.

**Q: Czy mogę używać bez kluczy API?**
A: Nie, aplikacja wymaga własnych kluczy API do działania.

**Q: Czy mogę exportować rozmowy?**
A: Obecnie nie ma wbudowanej funkcji, ale planowana w przyszłości.

**Q: Aplikacja zużywa dużo RAM**
A: To normalne dla aplikacji Electron. Można ograniczyć w Task Manager.

**Q: Czy są auto-updates?**
A: Obecnie nie, należy pobierać nowe wersje manualnie z GitHub.

### 📞 Wsparcie

**GitHub Issues**: [github.com/your-username/myllm-chat/issues](https://github.com/your-username/myllm-chat/issues)

**Przed zgłoszeniem problemu**:
1. Sprawdź czy problem jest już zgłoszony
2. Dołącz informacje o systemie (OS, wersja)
3. Dołącz logi błędów (jeśli są)
4. Opisz kroki do reprodukcji problemu

## 🤝 Contribution

1. Fork projektu
2. Stwórz branch dla nowej funkcjonalności (`git checkout -b feature/AmazingFeature`)
3. Commit zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📄 Licencja

Ten projekt jest licencjonowany na licencji MIT - zobacz plik [LICENSE](LICENSE) dla szczegółów.

## 💡 Motywacja

Projekt powstał z frustracji związanej z:

- **Wysokimi kosztami** abonamentów ChatGPT Plus/Pro
- **Ograniczeniami** w darmowych wersjach
- **Brakiem wyboru** modeli AI w jednym miejscu
- **Problemami z prywatnością** danych

MyLLM Chat rozwiązuje te problemy oferując:

- ✅ **Pełną kontrolę** nad kosztami (płacisz tylko za użycie)
- ✅ **Wybór modeli** AI w jednym interfejsie
- ✅ **Prywatność** (klucze API tylko u Ciebie)
- ✅ **Brak limitów** (poza limitami samych API)

## 🎯 Roadmapa

### ✅ Zrealizowane
- [x] **Pamięć wektorowa** - inteligentna pamięć między rozmowami
- [x] **Analiza intencji** - rozróżnianie kontynuacji od odwołań do przeszłości  
- [x] **Zarządzanie pamięcią** - konfiguracja prywatności i agresywności
- [x] **Synchronizacja danych** - automatyczne czyszczenie przy usuwaniu czatów

### 🔄 W planach
- [ ] **Interface pamięci** - panel zarządzania pamięcią w UI
- [ ] **Docker** - konteneryzacja aplikacji
- [ ] **Streaming odpowiedzi** - real-time streaming od AI
- [ ] **Export rozmów** - PDF/JSON/Markdown (z opcją exportu pamięci)
- [ ] **Wyszukiwanie semantyczne** - wyszukiwarka w historii i pamięci
- [ ] **Ciemny motyw** - przełącznik day/night mode
- [ ] **Wtyczki** - system rozszerzeń
- [ ] **API własne** - RESTful API dla integracji
- [ ] **Więcej modeli** - Cohere, Mistral, Llama
- [ ] **Pamięć współdzielona** - opcja dzielenia pamięci między użytkownikami (zespoły)

---

**⭐ Jeśli projekt Ci się podoba, zostaw gwiazdkę na GitHubie!**
