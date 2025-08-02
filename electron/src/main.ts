import { app, BrowserWindow, shell, dialog } from 'electron';
import * as path from 'path';
import { ServerManager } from './utils/server-manager';
import { DatabaseSetup } from './utils/database-setup';

// Import find-free-port with any type
const findFreePort = require('find-free-port') as (start: number, end: number) => Promise<number>;

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let serverManager: ServerManager | null = null;
let databaseSetup: DatabaseSetup | null = null;
let serverPort = 3001;
let frontendPort = 5173;

// Force development mode when running in dev environment
const isDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';
const isPackaged = app.isPackaged;

console.log('NODE_ENV:', process.env.NODE_ENV, 'isDevelopment:', isDevelopment, 'isPackaged:', isPackaged);

// Paths for bundled resources
const getResourcePath = (relativePath: string): string => {
  if (isDevelopment) {
    return path.join(__dirname, '../../', relativePath);
  }
  return path.join(process.resourcesPath, relativePath);
};

const getServerPath = (): string => {
  if (isDevelopment) {
    return path.join(__dirname, '../../server/dist/server.js');
  }
  return path.join(process.resourcesPath, 'server/server.js');
};

const getFrontendPath = (): string => {
  if (isDevelopment) {
    return `http://localhost:${frontendPort}`;
  }
  return `file://${path.join(process.resourcesPath, 'client/index.html')}`;
};

// Initialize database and server
const initializeBackend = async (): Promise<void> => {
  try {
    // Initialize database setup
    databaseSetup = new DatabaseSetup();
    await databaseSetup.initialize();
    
    // Find free port and initialize server manager
    if (!isDevelopment) {
      const port = await findFreePort(3001, 3100);
      serverPort = port;
      serverManager = new ServerManager(port);
      await serverManager.start();
    }
  } catch (error) {
    console.error('Backend initialization failed:', error);
    throw error;
  }
};

// Stop the backend server
const stopServer = (): void => {
  if (serverManager) {
    serverManager.stop();
    serverManager = null;
  }
};

// Create the main application window
const createMainWindow = (): void => {
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: isDevelopment 
      ? path.join(__dirname, '../build/icon.png')
      : path.join(process.resourcesPath, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  };

  mainWindow = new BrowserWindow(windowOptions);

  // Load the frontend
  const frontendUrl = getFrontendPath();
  console.log(`Loading frontend from: ${frontendUrl}`);
  
  mainWindow.loadURL(frontendUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // Open DevTools in development
      if (isDevelopment) {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== frontendUrl && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
};

// App event handlers
app.whenReady().then(async () => {
  try {
    console.log('App is ready, setting up...');
    
    // Initialize backend (database + server)
    await initializeBackend();
    
    // Create main window
    createMainWindow();
    
  } catch (error) {
    console.error('App startup error:', error);
    
    // Show error dialog
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start MyLLM Chat: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  console.log('App is quitting...');
  stopServer();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDevelopment) {
    // In development, ignore certificate errors for localhost
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Export for testing
export { mainWindow, serverManager, databaseSetup };