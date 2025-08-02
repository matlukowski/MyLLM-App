# MyLLM Chat - Electron Desktop Setup Guide

## ✅ Kompletna konfiguracja Electron

Aplikacja MyLLM Chat została w pełni skonfigurowana jako aplikacja desktopowa z następującymi funkcjami:

### 🏗️ Struktura projektu
```
myLLM/
├── client/          # React frontend (port 5173)
├── server/          # Node.js backend (port 3001)
├── electron/        # Electron desktop app
│   ├── src/
│   │   ├── main.ts          # Main process
│   │   ├── preload.ts       # Preload script
│   │   └── utils/
│   │       ├── server-manager.ts     # Backend management
│   │       └── database-setup.ts     # Database setup
│   ├── build/       # Icons placeholder
│   └── package.json # Electron config
└── package.json     # Root workspace config
```

### 🚀 Dostępne komendy

#### Development
```bash
# Uruchom web app (client + server)
npm run dev

# Uruchom desktop app w trybie dev (client + server + electron)
npm run dev:electron

# Zbuduj wszystkie komponenty
npm run build

# Uruchom Electron z zbudowanych plików
npm run electron:dev
```

#### Production builds
```bash
# Stwórz instalatory dla wszystkich platform
npm run electron:dist

# Windows (.exe/.msi)
npm run electron:dist:win

# macOS (.dmg/.pkg)
npm run electron:dist:mac

# Test build bez tworzenia instalatorów
npm run electron:pack
```

### 🔧 Funkcjonalności

#### ✅ Backend Integration
- Automatyczne uruchamianie serwera Node.js jako child process
- Graceful shutdown przy zamykaniu aplikacji
- Obsługa błędów uruchamiania serwera
- Port management z automatycznym znajdowaniem wolnych portów

#### ✅ Database Handling
- Development: PostgreSQL (istniejąca konfiguracja)
- Production: SQLite w katalogu użytkownika
- Automatyczne kopiowanie i konwersja schema Prisma
- Automatyczne uruchamianie migracji przy pierwszym starcie

#### ✅ Security
- Context isolation włączone
- Node integration wyłączone w renderer process
- Preload script z kontrolowanym API
- Zewnętrzne linki otwierane w domyślnej przeglądarce

#### ✅ User Experience
- Rozmiar okna: 1200x800 (min: 800x600)
- Proper app lifecycle dla macOS/Windows
- Loading handling podczas uruchamiania backendu
- Error dialogs dla problemów ze startem

#### ✅ Build System
- Electron Builder konfiguracja dla Windows/macOS/Linux
- NSIS installer dla Windows z opcjami instalacji
- DMG i PKG dla macOS (x64 + ARM64)
- AppImage i DEB dla Linux
- Bundling client/dist, server/dist i node_modules

### 📁 Lokalizacja plików w production

#### Database
- **Windows**: `%APPDATA%/myllm-chat-desktop/database.db`
- **macOS**: `~/Library/Application Support/myllm-chat-desktop/database.db`
- **Linux**: `~/.config/myllm-chat-desktop/database.db`

#### Bundled resources
```
app.asar.unpacked/
├── client/          # React build
├── server/          # Node.js build + node_modules
└── server/prisma/   # Database schema
```

### 🎯 Następne kroki

#### 1. Dodaj ikony aplikacji
Umieść w `electron/build/`:
- `icon.ico` (Windows, 256x256)
- `icon.icns` (macOS, 512x512)  
- `icon.png` (Linux, 512x512)

#### 2. Test build
```bash
# Zainstaluj dependencies
npm install

# Zbuduj wszystko
npm run build:electron

# Test lokalnego packageowania
npm run electron:pack

# Stwórz installer dla swojej platformy
npm run electron:dist:win   # Windows
npm run electron:dist:mac   # macOS
```

#### 3. Dostosuj metadane
Edytuj `electron/package.json`:
- `build.appId` - unikalne ID aplikacji
- `build.productName` - nazwa produktu
- Dodaj `author`, `description`, `homepage`
- Konfiguruj `build.win.publisherName` dla Windows

#### 4. Code signing (opcjonalne)
Dla publikacji w sklepach dodaj:
- Windows: `certificateFile` i `certificatePassword`
- macOS: Developer ID certificate
- Auto-updater konfiguracja

### 🔍 Rozwiązywanie problemów

#### Server nie startuje
```bash
# Sprawdź czy server się zbudował
npm run build --workspace=server
ls server/dist/server.js
```

#### Database błędy
```bash
# Resetuj database (usuń folder użytkownika)
# Windows: usuń %APPDATA%/myllm-chat-desktop/
# macOS: usuń ~/Library/Application Support/myllm-chat-desktop/
# Linux: usuń ~/.config/myllm-chat-desktop/
```

#### Build błędy
```bash
# Reinstaluj dependencies
rm -rf node_modules */node_modules
npm install
npm run postinstall
```

### 📋 Wymagania

- **Node.js**: 18.0.0+
- **npm**: 8.0.0+
- **RAM**: 4GB+ dla build procesu
- **Dysk**: 2GB+ dla dependencies i build output

---

**Status**: ✅ Kompletnie skonfigurowane i gotowe do testowania