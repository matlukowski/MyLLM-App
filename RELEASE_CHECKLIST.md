# MyLLM Chat - Release Checklist

Pełna lista kroków do wykonania przed wydaniem nowej wersji aplikacji desktop.

## 📋 Pre-Release Checklist

### 🔍 1. Testowanie i walidacja
- [ ] **Funkcjonalne testy**
  - [ ] Logowanie/rejestracja działa
  - [ ] Tworzenie nowych czatów
  - [ ] Wysyłanie wiadomości do AI (wszystkie modele)
  - [ ] Przesyłanie plików (PDF, DOCX, obrazy)
  - [ ] Usuwanie czatów
  - [ ] Konfiguracja kluczy API
  - [ ] Pamięć wektorowa (jeśli włączona)

- [ ] **Build test**
  ```bash
  npm run release:clean
  npm run release:test
  ```

- [ ] **Cross-platform test** (jeśli masz dostęp)
  - [ ] Windows build: `npm run release:build:win`
  - [ ] macOS build: `npm run release:build:mac`  
  - [ ] Linux build: `npm run release:build:linux`

### 📝 2. Dokumentacja
- [ ] **Update wersji**
  - [ ] `package.json` (root)
  - [ ] `electron/package.json`
  - [ ] `client/package.json`
  - [ ] `server/package.json`

- [ ] **CHANGELOG.md** (jeśli istnieje)
  - [ ] Dodaj nowe funkcje
  - [ ] Poprawki błędów
  - [ ] Breaking changes
  - [ ] Data wydania

- [ ] **README.md**
  - [ ] Sprawdź czy linki do releases działają
  - [ ] Update system requirements
  - [ ] Nowe screenshoty (jeśli zmieniono UI)

### 🎯 3. Przygotowanie kodu
- [ ] **Commit wszystkich zmian**
  ```bash
  git add .
  git commit -m "chore: prepare for release v1.x.x"
  git push origin main
  ```

- [ ] **Git tag**
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

## 🚀 Release Process

### 📦 1. Build aplikacji

#### Opcja A: Wszystkie platformy (jeśli masz dostęp)
```bash
npm run release:build:all
```

#### Opcja B: Per platforma
```bash
# Windows
npm run release:build:win

# macOS (tylko na macOS)  
npm run release:build:mac

# Linux
npm run release:build:linux
```

### 📂 2. Sprawdź pliki wyjściowe

Przejdź do `electron/release/` i sprawdź czy masz:

#### Windows:
- [ ] `MyLLM-Chat-Setup-1.0.0.exe` (~100-200MB)
- [ ] `MyLLM-Chat-1.0.0.msi` (~100-200MB)

#### macOS:
- [ ] `MyLLM-Chat-1.0.0-x64.dmg` (Intel)
- [ ] `MyLLM-Chat-1.0.0-arm64.dmg` (Apple Silicon)
- [ ] `MyLLM-Chat-1.0.0-x64.pkg` (Intel)
- [ ] `MyLLM-Chat-1.0.0-arm64.pkg` (Apple Silicon)

#### Linux:
- [ ] `MyLLM-Chat-1.0.0.AppImage` (~100-200MB)
- [ ] `MyLLM-Chat_1.0.0_amd64.deb` (~100-200MB)

### 🧪 3. Test instalatorów

Jeśli możesz, przetestuj przynajmniej jeden installer:

#### Windows:
- [ ] Uruchom `.exe` installer
- [ ] Sprawdź czy aplikacja startuje
- [ ] Sprawdź czy ikona jest na pulpicie/menu
- [ ] Test podstawowych funkcji

#### macOS:
- [ ] Otwórz `.dmg`
- [ ] Przeciągnij do Applications
- [ ] Uruchom (może potrzebować "Open Anyway")
- [ ] Test podstawowych funkcji

#### Linux:
- [ ] `chmod +x MyLLM-Chat-*.AppImage`
- [ ] `./MyLLM-Chat-*.AppImage`
- [ ] Test podstawowych funkcji

### 🌐 4. Utwórz GitHub Release

1. **Przejdź na GitHub**
   - Idź do repozytorium
   - Kliknij "Releases"
   - Kliknij "Create a new release"

2. **Wypełnij formularz**
   - [ ] **Tag**: `v1.0.0` (musi się zgadzać z git tag)
   - [ ] **Title**: `MyLLM Chat v1.0.0`
   - [ ] **Description**: 
     ```markdown
     ## 🎉 MyLLM Chat v1.0.0
     
     ### 🆕 Nowe funkcje
     - [Lista nowych funkcji]
     
     ### 🐛 Poprawki
     - [Lista poprawek]
     
     ### 📥 Pobierz
     
     #### Windows
     - **[MyLLM-Chat-Setup-1.0.0.exe](link)** - NSIS Installer
     - **[MyLLM-Chat-1.0.0.msi](link)** - MSI Package
     
     #### macOS
     - **[MyLLM-Chat-1.0.0-x64.dmg](link)** - Intel Macs
     - **[MyLLM-Chat-1.0.0-arm64.dmg](link)** - Apple Silicon
     
     #### Linux
     - **[MyLLM-Chat-1.0.0.AppImage](link)** - Portable
     - **[MyLLM-Chat_1.0.0_amd64.deb](link)** - Debian/Ubuntu
     
     ### 🔧 System Requirements
     - Windows 10/11 (64-bit)
     - macOS 10.15+ (Intel/Apple Silicon)
     - Ubuntu 18.04+ / Debian 10+
     ```

3. **Attach files**
   - [ ] Przeciągnij wszystkie pliki z `electron/release/`
   - [ ] Sprawdź czy wszystkie się przesłały

4. **Publish**
   - [ ] Kliknij "Publish release"
   - [ ] Sprawdź czy release jest oznaczony jako "Latest"

## ✅ Post-Release

### 📢 1. Komunikacja
- [ ] **Update README** linków (jeśli potrzeba)
- [ ] **Social media** post (jeśli masz)
- [ ] **Discord/community** notification

### 🧹 2. Cleanup
- [ ] **Local cleanup**
  ```bash
  npm run release:clean
  ```

- [ ] **Archive old releases** (opcjonalne)
  - Zostaw 2-3 najnowsze wersje
  - Usuń bardzo stare releases z GitHub

### 📊 3. Monitoring
- [ ] **Sprawdź download stats** po kilku dniach
- [ ] **Monitor issues** - czy użytkownicy zgłaszają problemy
- [ ] **Feedback** - czy aplikacja działa poprawnie

## 🆘 Troubleshooting

### ❌ Build fails
```bash
# Wyczyść wszystko i spróbuj ponownie
npm run release:clean
rm -rf node_modules */node_modules
npm install
npm run release:test
npm run release:build:win
```

### ❌ Git tag już istnieje
```bash
# Usuń tag lokalnie i na remote
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Utwórz nowy
git tag v1.0.0
git push origin v1.0.0
```

### ❌ GitHub upload fails
- Sprawdź czy masz uprawnienia do repo
- Sprawdź rozmiar plików (max 2GB na plik)
- Spróbuj przesłać pliki jeden za drugim

### ❌ Aplikacja nie startuje po instalacji
- Sprawdź logi w konsoli developera
- Sprawdź czy wszystkie dependencies są w bundle
- Sprawdź ścieżki do plików w Electron config

---

## 📝 Template dla Release Notes

```markdown
## 🎉 MyLLM Chat v1.0.0

**Release Date**: 2025-01-XX

### 🆕 New Features
- ✨ Feature A - description
- ✨ Feature B - description

### 🐛 Bug Fixes  
- 🔧 Fixed issue X
- 🔧 Fixed issue Y

### 🔄 Changes
- 📝 Updated UI component Z
- 📝 Improved performance of W

### 🚀 Installation
Download the installer for your platform from the assets below.

**System Requirements:**
- Windows 10/11 (64-bit) 
- macOS 10.15+ (Intel/Apple Silicon)
- Ubuntu 18.04+ / Debian 10+

**First time setup:**
1. Install the application
2. Configure your API keys in Settings
3. Start chatting with AI!

### 🆘 Known Issues
- Issue A - workaround X
- Issue B - will be fixed in next release

### 🙏 Credits
Thanks to all contributors and testers!
```