import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class ServerManager {
  private serverProcess: ChildProcess | null = null;
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  constructor(private port: number = 3001) {}

  async start(): Promise<void> {
    if (this.isDevelopment) {
      console.log('Development mode: Server should be started manually');
      return;
    }

    const serverPath = this.getServerPath();
    
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server script not found at: ${serverPath}`);
    }

    return new Promise((resolve, reject) => {
      console.log(`Starting server from: ${serverPath}`);
      
      this.serverProcess = spawn('node', [serverPath], {
        cwd: path.dirname(serverPath),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: this.port.toString(),
          DATABASE_URL: this.getDatabaseUrl()
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stdout?.on('data', (data) => {
        console.log(`Server stdout: ${data}`);
      });

      this.serverProcess.stderr?.on('data', (data) => {
        console.error(`Server stderr: ${data}`);
      });

      this.serverProcess.on('error', (error) => {
        console.error('Server process error:', error);
        reject(error);
      });

      this.serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        this.serverProcess = null;
      });

      // Wait for server to start
      setTimeout(() => {
        console.log(`Server started on port ${this.port}`);
        resolve();
      }, 3000);
    });
  }

  stop(): void {
    if (this.serverProcess) {
      console.log('Stopping server...');
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
  }

  isRunning(): boolean {
    return this.serverProcess !== null;
  }

  private getServerPath(): string {
    if (this.isDevelopment) {
      return path.join(__dirname, '../../../server/dist/server.js');
    }
    return path.join(process.resourcesPath, 'server/server.js');
  }

  private getDatabaseUrl(): string {
    if (this.isDevelopment) {
      return process.env.DATABASE_URL || 'postgresql://localhost:5432/myllm_chat';
    }
    
    // Production: Use SQLite in user data directory
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.db');
    return `file:${dbPath}`;
  }
}