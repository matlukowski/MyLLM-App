import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { spawn } from 'child_process';

export class DatabaseSetup {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly userDataPath = app.getPath('userData');

  async initialize(): Promise<void> {
    if (this.isDevelopment) {
      console.log('Development mode: Using existing PostgreSQL database');
      return;
    }

    try {
      await this.setupSQLiteDatabase();
      await this.runMigrations();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async setupSQLiteDatabase(): Promise<void> {
    const dbPath = path.join(this.userDataPath, 'database.db');
    const prismaPath = path.join(this.userDataPath, 'prisma');

    // Set environment variable for Prisma
    process.env.DATABASE_URL = `file:${dbPath}`;
    
    console.log(`Database will be created at: ${dbPath}`);
    
    // Copy prisma files if they don't exist
    if (!fs.existsSync(prismaPath)) {
      await this.copyPrismaFiles(prismaPath);
    }

    // Update schema.prisma to use SQLite
    await this.updateSchemaForSQLite(prismaPath);
  }

  private async copyPrismaFiles(destPath: string): Promise<void> {
    // Try development path first (relative to project root)
    let sourcePrismaPath = path.join(__dirname, '../../../../server/prisma');
    
    // If development path doesn't exist, try production path
    if (!fs.existsSync(sourcePrismaPath)) {
      sourcePrismaPath = path.join(process.resourcesPath, 'server/prisma');
    }
    
    if (!fs.existsSync(sourcePrismaPath)) {
      throw new Error(`Prisma files not found at: ${sourcePrismaPath}`);
    }

    fs.mkdirSync(destPath, { recursive: true });
    
    // Copy schema and migrations
    this.copyDirSync(sourcePrismaPath, destPath);
    console.log('Prisma files copied to user data directory');
  }

  private copyDirSync(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private async updateSchemaForSQLite(prismaPath: string): Promise<void> {
    const schemaPath = path.join(prismaPath, 'schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('schema.prisma not found, skipping SQLite conversion');
      return;
    }

    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Replace PostgreSQL provider with SQLite
    schemaContent = schemaContent.replace(
      /provider\s*=\s*"postgresql"/g,
      'provider = "sqlite"'
    );
    
    // Remove PostgreSQL-specific features that aren't supported in SQLite
    schemaContent = schemaContent.replace(/@db\.Uuid/g, '');
    schemaContent = schemaContent.replace(/@default\(uuid\(\)\)/g, '@default(cuid())');
    
    fs.writeFileSync(schemaPath, schemaContent);
    console.log('Updated schema.prisma for SQLite');
  }

  private async runMigrations(): Promise<void> {
    return new Promise((resolve, reject) => {
      const prismaPath = path.join(this.userDataPath, 'prisma');
      
      // Try development path first (relative to project root)
      let nodeModulesPath = path.join(__dirname, '../../../../server/node_modules');
      
      // If development path doesn't exist, try production path
      if (!fs.existsSync(nodeModulesPath)) {
        nodeModulesPath = path.join(process.resourcesPath, 'server/node_modules');
      }
      
      const prismaBin = path.join(nodeModulesPath, '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
      
      // Check if Prisma binary exists
      if (!fs.existsSync(prismaBin)) {
        console.warn(`Prisma binary not found at: ${prismaBin}`);
        console.log('Skipping database migrations in development mode');
        resolve();
        return;
      }

      console.log('Running database migrations...');
      
      const migrateProcess = spawn(prismaBin, ['db', 'push', '--schema', path.join(prismaPath, 'schema.prisma')], {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      migrateProcess.stdout?.on('data', (data) => {
        console.log(`Migration stdout: ${data}`);
      });

      migrateProcess.stderr?.on('data', (data) => {
        console.error(`Migration stderr: ${data}`);
      });

      migrateProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Database migrations completed successfully');
          resolve();
        } else {
          reject(new Error(`Migration process exited with code ${code}`));
        }
      });

      migrateProcess.on('error', (error) => {
        console.error('Migration process error:', error);
        reject(error);
      });
    });
  }

  getDatabasePath(): string {
    return path.join(this.userDataPath, 'database.db');
  }

  getDatabaseUrl(): string {
    return `file:${this.getDatabasePath()}`;
  }
}