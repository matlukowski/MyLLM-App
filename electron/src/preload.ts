import { contextBridge, ipcRenderer, shell } from 'electron';

// Security: Define what APIs are exposed to the renderer process
const electronAPI = {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // File operations
  openExternal: (url: string) => shell.openExternal(url),
  
  // System info
  platform: process.platform,
  
  // Event listeners for app events
  onAppReady: (callback: () => void) => ipcRenderer.on('app:ready', callback),
  onAppError: (callback: (event: any, error: string) => void) => ipcRenderer.on('app:error', callback),
  
  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
};

// Security: Only expose specific APIs to the renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Security: Prevent access to Node.js APIs in renderer
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

declare const window: Window & typeof globalThis;

