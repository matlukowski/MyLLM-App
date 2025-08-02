# MyLLM Chat - Desktop Application

This folder contains the Electron desktop application for MyLLM Chat.

## Development

### Prerequisites
- Node.js 18+
- npm 8+

### Setup
1. Install dependencies for all workspaces from root:
   ```bash
   cd ..
   npm install
   ```

2. Build the client and server:
   ```bash
   npm run build
   ```

3. Start development mode:
   ```bash
   npm run dev:electron
   ```

### Building for Distribution

#### Windows
```bash
npm run electron:dist:win
```
Creates `.exe` and `.msi` installers in `electron/release/`

#### macOS
```bash
npm run electron:dist:mac
```
Creates `.dmg` and `.pkg` installers in `electron/release/`

#### Linux
```bash
npm run electron:dist:linux
```
Creates `.AppImage` and `.deb` packages in `electron/release/`

### Development Scripts

- `npm run dev` - Start Electron in development mode with TypeScript watching
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start Electron from compiled JavaScript
- `npm run pack` - Package the app without creating installer

## Architecture

### Main Process (`src/main.ts`)
- Manages application lifecycle
- Creates and manages browser windows
- Handles backend server as child process
- Manages database setup and migrations

### Preload Script (`src/preload.ts`)
- Provides secure API bridge between main and renderer processes
- Exposes limited Electron APIs to the frontend

### Utilities
- `src/utils/server-manager.ts` - Backend server lifecycle management
- `src/utils/database-setup.ts` - Database initialization for desktop

## Database

In development, the app uses the existing PostgreSQL database.

In production builds, the app automatically sets up a local SQLite database in the user's data directory:
- Windows: `%APPDATA%/myllm-chat-desktop/database.db`
- macOS: `~/Library/Application Support/myllm-chat-desktop/database.db`
- Linux: `~/.config/myllm-chat-desktop/database.db`

## Security

The desktop app follows Electron security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Preload script provides controlled API access
- External links open in default browser

## Bundle Contents

The built application includes:
- Frontend React app (`client/dist/`)
- Backend Node.js server (`server/dist/`)
- Server dependencies (`server/node_modules/`)
- Prisma schema and migrations (`server/prisma/`)

## Icons

Place application icons in `build/`:
- `icon.ico` - Windows icon (256x256)
- `icon.icns` - macOS icon (512x512)
- `icon.png` - Linux icon (512x512)

## Troubleshooting

### Server Won't Start
Check that the server was built successfully:
```bash
npm run build --workspace=server
```

### Database Issues
Delete the database file from the user data directory to reset:
- Windows: `%APPDATA%/myllm-chat-desktop/`
- macOS: `~/Library/Application Support/myllm-chat-desktop/`
- Linux: `~/.config/myllm-chat-desktop/`

### Build Fails
Ensure all dependencies are installed:
```bash
npm install
npm run postinstall
```