import { PrismaClient } from '@prisma/client';
import KeywordMemoryService from './KeywordMemoryService';
import ImportanceScorer from './ImportanceScorer';

interface MemoryEntry {
  id: string;
  content: string;
  embedding: string; // SQLite stores as JSON string
  importanceScore: number;
  timestamp: Date;
  chatId: string;
  messageId?: string;
  context?: string;
  tags: string; // SQLite stores as JSON string
  metadata?: any;
}

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  importanceScore: number;
  timestamp: Date;
  tags: string[];
  context?: string;
  relevanceScore: number; // Kombinacja similarity + importance
}

interface SearchFilters {
  chatId?: string;
  tags?: string[];
  minImportance?: number;
  maxAge?: number; // dni
  limit?: number;
}

class VectorMemoryService {
  private prisma: PrismaClient;
  private keywordMemoryService: KeywordMemoryService;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    this.keywordMemoryService = KeywordMemoryService.getInstance();
  }

  /**
   * Inicjalizuje serwis pamięci wektorowej
   */
  public async initialize(): Promise<void> {
    console.log('🧠 Inicjalizacja VectorMemoryService...');
    console.log('✅ VectorMemoryService zainicjalizowany');
    console.log('🧠 VectorMemoryService initialized for single user mode');
  }

  /**
   * Dodaje nowy wpis do pamięci wektorowej
   */
  public async addMemoryEntry(
    content: string,
    chatId: string,
    messageId?: string,
    context?: string
  ): Promise<MemoryEntry | null> {
    
    try {
      // 1. Ocena ważności
      const importanceResult = ImportanceScorer.calculateImportance(
        content, 
        context, 
        true, 
        content.length
      );

      // 2. Sprawdź ustawienia pamięci (domyślne dla single user)
      const settings = await this.getMemorySettings();
      
      // Sprawdź czy pamięć jest włączona
      if (settings?.memoryEnabled === false) {
        console.log(`🚫 Pamięć wyłączona`);
        return null;
      }
      
      // Sprawdź tryb incognito
      if (settings?.incognitoMode === true) {
        console.log(`🕵️ Tryb incognito aktywny`);
        return null;
      }
      
      const threshold = settings?.importanceThreshold || 0.3;
      
      console.log(`📊 Ocena ważności: ${importanceResult.score.toFixed(2)} (próg: ${threshold})`);
      console.log(`🏷️ Tagi: ${importanceResult.tags.join(', ') || 'brak'}`);
      console.log(`💭 Uzasadnienie: ${importanceResult.reasoning}`);
      
      if (!ImportanceScorer.shouldStoreInMemory(importanceResult.score, threshold)) {
        console.log(`⏭️ Pominięto wpis o niskiej ważności (${importanceResult.score.toFixed(2)} < ${threshold})`);
        return null;
      }

      // 3. Dodaj do pamięci słów kluczowych (szybsze i bardziej niezawodne)
      this.keywordMemoryService.addMemory(content);

      // 4. Sprawdź limity pamięci
      await this.enforceMemoryLimits();

      // 5. Zapisz w bazie danych (bez embedding)
      const memoryEntry = await this.prisma.vectorMemory.create({
        data: {
          content,
          embedding: '[]', // Empty embedding for keyword-based approach
          importanceScore: importanceResult.score,
          chatId,
          messageId,
          context,
          tags: JSON.stringify(importanceResult.tags), // Convert to string for SQLite
          metadata: JSON.stringify({
            reasoning: importanceResult.reasoning,
            factors: importanceResult.factors,
            createdAt: new Date().toISOString()
          })
        }
      });

      console.log(`✅ Dodano wpis do pamięci: ${content.substring(0, 50)}... (ważność: ${importanceResult.score.toFixed(2)})`);

      return {
        id: memoryEntry.id,
        content: memoryEntry.content,
        embedding: memoryEntry.embedding,
        importanceScore: memoryEntry.importanceScore,
        timestamp: memoryEntry.timestamp,
        chatId: memoryEntry.chatId,
        messageId: memoryEntry.messageId || undefined,
        context: memoryEntry.context || undefined,
        tags: memoryEntry.tags,
        metadata: memoryEntry.metadata
      };

    } catch (error) {
      console.error('❌ Błąd dodawania wpisu do pamięci:', error);
      return null;
    }
  }

  /**
   * Wyszukuje podobne wpisy w pamięci (używa KeywordMemoryService)
   */
  public async searchMemory(
    query: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    
    try {
      console.log(`🔍 Wyszukiwanie w pamięci dla: "${query.substring(0, 50)}..."`);
      
      // Używaj KeywordMemoryService dla szybkiego wyszukiwania
      const keywordResults = this.keywordMemoryService.searchMemories(query, filters.limit || 5);
      
      // Konwertuj wyniki KeywordMemoryService na format SearchResult
      const searchResults: SearchResult[] = keywordResults.map(memory => ({
        id: memory.id,
        content: memory.content,
        similarity: memory.relevanceScore || 0.5,
        importanceScore: 0.7, // Default importance for keyword-based results
        timestamp: memory.timestamp,
        tags: memory.keywords,
        context: undefined,
        relevanceScore: (memory.relevanceScore || 0.5) * 0.7 // Combined score
      }));

      console.log(`✅ Znaleziono ${searchResults.length} wyników w pamięci słów kluczowych`);
      return searchResults;

    } catch (error) {
      console.error('❌ Błąd wyszukiwania w pamięci:', error);
      return [];
    }
  }

  /**
   * Pobiera kontekst z pamięci (używa KeywordMemoryService)
   */
  public async getMemoryContext(
    query: string,
    chatId?: string,
    maxTokens: number = 2000
  ): Promise<string> {
    
    // Sprawdź ustawienia pamięci
    const settings = await this.getMemorySettings();
    
    if (settings?.memoryEnabled === false) {
      console.log(`🚫 Pamięć wyłączona`);
      return '';
    }

    // Używaj KeywordMemoryService dla szybkiego wyszukiwania
    const context = this.keywordMemoryService.getRelevantContext(query);
    
    if (context) {
      console.log(`📋 Utworzono kontekst ze słów kluczowych (${context.length} znaków)`);
    }
    
    return context;
  }

  /**
   * Pobiera ustawienia pamięci (single user mode)
   */
  private async getMemorySettings() {
    // Try to get settings from database, create default if not exists
    let settings = await this.prisma.memorySettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.memorySettings.create({
        data: {
          importanceThreshold: 0.3,
          maxMemoryEntries: 10000,
          retentionDays: 365,
          autoCleanupEnabled: true,
          memoryEnabled: true,
          autoDeleteOnChatRemoval: true,
          incognitoMode: false,
          shareMemoryAcrossChats: true,
          memoryAggressiveness: 'conservative'
        }
      });
    }
    
    return settings;
  }

  /**
   * Egzekwuje limity pamięci
   */
  private async enforceMemoryLimits(): Promise<void> {
    const settings = await this.getMemorySettings();
    const maxEntries = settings.maxMemoryEntries;

    // Sprawdź obecną liczbę wpisów
    const currentCount = await this.prisma.vectorMemory.count();

    if (currentCount >= maxEntries) {
      // Usuń najstarsze, najmniej ważne wpisy
      const toDeleteCount = Math.max(1, Math.floor(maxEntries * 0.1)); // Usuń 10%
      
      const oldEntries = await this.prisma.vectorMemory.findMany({
        orderBy: [
          { importanceScore: 'asc' },
          { timestamp: 'asc' }
        ],
        take: toDeleteCount,
        select: { id: true }
      });

      if (oldEntries.length > 0) {
        await this.prisma.vectorMemory.deleteMany({
          where: {
            id: { in: oldEntries.map(entry => entry.id) }
          }
        });

        console.log(`🧹 Usunięto ${oldEntries.length} starych wpisów z pamięci`);
      }
    }
  }

  /**
   * Czyści pamięć zgodnie z polityką retencji
   */
  public async cleanupMemory(): Promise<number> {
    try {
      const settings = await this.getMemorySettings();
      const retentionDays = settings.retentionDays;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.prisma.vectorMemory.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      console.log(`🧹 Wyczyszczono ${result.count} starych wpisów z pamięci`);
      return result.count;

    } catch (error) {
      console.error('❌ Błąd czyszczenia pamięci:', error);
      return 0;
    }
  }

  /**
   * Usuwa wpisy pamięci powiązane z konkretnym czatem
   */
  public async deleteMemoryByChat(chatId: string): Promise<number> {
    try {
      const result = await this.prisma.vectorMemory.deleteMany({
        where: { chatId }
      });

      console.log(`🗑️ Usunięto ${result.count} wpisów pamięci z czatu ${chatId}`);
      return result.count;
    } catch (error) {
      console.error('❌ Błąd usuwania pamięci czatu:', error);
      return 0;
    }
  }

  /**
   * Usuwa wpisy pamięci powiązane z konkretną wiadomością
   */
  public async deleteMemoryByMessage(messageId: string): Promise<number> {
    try {
      const result = await this.prisma.vectorMemory.deleteMany({
        where: { messageId }
      });

      console.log(`🗑️ Usunięto ${result.count} wpisów pamięci dla wiadomości ${messageId}`);
      return result.count;
    } catch (error) {
      console.error('❌ Błąd usuwania pamięci wiadomości:', error);
      return 0;
    }
  }

  /**
   * Usuwa całą pamięć (single user mode)
   */
  public async deleteAllMemory(): Promise<number> {
    try {
      const result = await this.prisma.vectorMemory.deleteMany({});

      console.log(`🗑️ Usunięto całą pamięć: ${result.count} wpisów`);
      return result.count;
    } catch (error) {
      console.error('❌ Błąd usuwania pamięci:', error);
      return 0;
    }
  }

  /**
   * Sprawdza spójność pamięci i usuwa osierocone wpisy
   */
  public async validateMemoryConsistency(): Promise<{
    orphanedEntries: number;
    invalidChats: number;
    invalidMessages: number;
  }> {
    try {
      console.log(`🔍 Sprawdzanie spójności pamięci...`);

      // Znajdź wpisy pamięci bez odpowiadających im czatów
      const orphanedByChat = await this.prisma.vectorMemory.findMany({
        where: {
          NOT: {
            chatId: {
              in: await this.prisma.chat.findMany({
                select: { id: true }
              }).then(chats => chats.map(c => c.id))
            }
          }
        },
        select: { id: true, chatId: true }
      });

      // Znajdź wpisy pamięci bez odpowiadających im wiadomości (jeśli messageId nie jest null)
      const orphanedByMessage = await this.prisma.vectorMemory.findMany({
        where: {
          messageId: { not: null },
          NOT: {
            messageId: {
              in: await this.prisma.message.findMany({
                select: { id: true }
              }).then(messages => messages.map(m => m.id))
            }
          }
        },
        select: { id: true, messageId: true }
      });

      // Usuń osierocone wpisy
      let totalDeleted = 0;

      if (orphanedByChat.length > 0) {
        const chatResult = await this.prisma.vectorMemory.deleteMany({
          where: {
            id: { in: orphanedByChat.map(entry => entry.id) }
          }
        });
        totalDeleted += chatResult.count;
        console.log(`🧹 Usunięto ${chatResult.count} wpisów z nieistniejącymi czatami`);
      }

      if (orphanedByMessage.length > 0) {
        const messageResult = await this.prisma.vectorMemory.deleteMany({
          where: {
            id: { in: orphanedByMessage.map(entry => entry.id) }
          }
        });
        totalDeleted += messageResult.count;
        console.log(`🧹 Usunięto ${messageResult.count} wpisów z nieistniejącymi wiadomościami`);
      }

      const stats = {
        orphanedEntries: totalDeleted,
        invalidChats: orphanedByChat.length,
        invalidMessages: orphanedByMessage.length
      };

      console.log(`✅ Weryfikacja spójności zakończona. Usunięto ${totalDeleted} osieroconych wpisów`);
      return stats;

    } catch (error) {
      console.error('❌ Błąd weryfikacji spójności pamięci:', error);
      return { orphanedEntries: 0, invalidChats: 0, invalidMessages: 0 };
    }
  }

  /**
   * Pobiera statystyki pamięci
   */
  public async getMemoryStats(): Promise<{
    totalEntries: number;
    entriesByChat: { chatId: string; count: number; }[];
    topTags: { tag: string; count: number; }[];
    averageImportance: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const totalEntries = await this.prisma.vectorMemory.count();

      const entriesByChat = await this.prisma.vectorMemory.groupBy({
        by: ['chatId'],
        _count: { id: true }
      });

      const averageImportance = await this.prisma.vectorMemory.aggregate({
        _avg: { importanceScore: true }
      });

      const timeRange = await this.prisma.vectorMemory.aggregate({
        _min: { timestamp: true },
        _max: { timestamp: true }
      });

      // Policz tagi (parse from JSON strings)
      const allMemoryEntries = await this.prisma.vectorMemory.findMany({
        select: { tags: true }
      });

      const tagCounts: { [key: string]: number } = {};
      allMemoryEntries.forEach(entry => {
        try {
          const tags = JSON.parse(entry.tags);
          tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        } catch {
          // Skip invalid JSON
        }
      });

      const topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      return {
        totalEntries,
        entriesByChat: entriesByChat.map(entry => ({
          chatId: entry.chatId,
          count: entry._count.id
        })),
        topTags,
        averageImportance: averageImportance._avg.importanceScore || 0,
        oldestEntry: timeRange._min.timestamp,
        newestEntry: timeRange._max.timestamp
      };

    } catch (error) {
      console.error('❌ Błąd pobierania statystyk pamięci:', error);
      return {
        totalEntries: 0,
        entriesByChat: [],
        topTags: [],
        averageImportance: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
  }

  /**
   * Sprawdza czy serwis jest gotowy
   */
  public isReady(): boolean {
    return true; // KeywordMemoryService is always ready
  }
}

export default VectorMemoryService;