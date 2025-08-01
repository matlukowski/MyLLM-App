import { PrismaClient } from '@prisma/client';
import EmbeddingsService from './EmbeddingsService';
import ImportanceScorer from './ImportanceScorer';

interface MemoryEntry {
  id: string;
  content: string;
  embedding: number[];
  importanceScore: number;
  timestamp: Date;
  userId: string;
  chatId: string;
  messageId?: string;
  context?: string;
  tags: string[];
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
  userId?: string;
  chatId?: string;
  tags?: string[];
  minImportance?: number;
  maxAge?: number; // dni
  limit?: number;
}

class VectorMemoryService {
  private prisma: PrismaClient;
  private embeddingsService: EmbeddingsService;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    this.embeddingsService = EmbeddingsService.getInstance();
  }

  /**
   * Inicjalizuje serwis pamięci wektorowej
   */
  public async initialize(): Promise<void> {
    console.log('🧠 Inicjalizacja VectorMemoryService...');
    
    try {
      await this.embeddingsService.initialize();
      console.log('✅ VectorMemoryService zainicjalizowany');
    } catch (error) {
      console.error('❌ Błąd inicjalizacji VectorMemoryService:', error);
      throw error;
    }
  }

  /**
   * Dodaje nowy wpis do pamięci wektorowej
   */
  public async addMemoryEntry(
    content: string,
    userId: string,
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

      // 2. Sprawdź ustawienia prywatności użytkownika
      const userSettings = await this.getUserMemorySettings(userId);
      
      // Sprawdź czy pamięć jest włączona
      if (userSettings?.memoryEnabled === false) {
        console.log(`🚫 Pamięć wyłączona dla użytkownika ${userId}`);
        return null;
      }
      
      // Sprawdź tryb incognito
      if (userSettings?.incognitoMode === true) {
        console.log(`🕵️ Tryb incognito aktywny dla użytkownika ${userId}`);
        return null;
      }
      
      const threshold = userSettings?.importanceThreshold || 0.3;
      
      console.log(`📊 Ocena ważności: ${importanceResult.score.toFixed(2)} (próg: ${threshold})`);
      console.log(`🏷️ Tagi: ${importanceResult.tags.join(', ') || 'brak'}`);
      console.log(`💭 Uzasadnienie: ${importanceResult.reasoning}`);
      
      if (!ImportanceScorer.shouldStoreInMemory(importanceResult.score, threshold)) {
        console.log(`⏭️ Pominięto wpis o niskiej ważności (${importanceResult.score.toFixed(2)} < ${threshold})`);
        return null;
      }

      // 3. Generuj embedding
      const embeddingResult = await this.embeddingsService.generateEmbedding(content);
      
      if (embeddingResult.error || embeddingResult.embedding.length === 0) {
        console.error('❌ Nie udało się wygenerować embedding:', embeddingResult.error);
        return null;
      }

      // 4. Sprawdź limity użytkownika
      await this.enforceMemoryLimits(userId);

      // 5. Zapisz w bazie danych
      const memoryEntry = await this.prisma.vectorMemory.create({
        data: {
          content,
          embedding: embeddingResult.embedding,
          importanceScore: importanceResult.score,
          userId,
          chatId,
          messageId,
          context,
          tags: importanceResult.tags,
          metadata: {
            reasoning: importanceResult.reasoning,
            factors: importanceResult.factors as any, // Rzutowanie na JSON
            createdAt: new Date().toISOString()
          }
        }
      });

      console.log(`✅ Dodano wpis do pamięci: ${content.substring(0, 50)}... (ważność: ${importanceResult.score.toFixed(2)})`);

      return {
        id: memoryEntry.id,
        content: memoryEntry.content,
        embedding: memoryEntry.embedding,
        importanceScore: memoryEntry.importanceScore,
        timestamp: memoryEntry.timestamp,
        userId: memoryEntry.userId,
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
   * Wyszukuje podobne wpisy w pamięci
   */
  public async searchMemory(
    query: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    
    try {
      // 1. Generuj embedding dla zapytania
      const queryEmbeddingResult = await this.embeddingsService.generateEmbedding(query);
      
      if (queryEmbeddingResult.error || queryEmbeddingResult.embedding.length === 0) {
        console.error('❌ Nie udało się wygenerować embedding dla zapytania');
        return [];
      }

      // 2. Pobierz kandydatów z bazy danych z filtrami
      const whereClause: any = {};
      
      if (filters.userId) whereClause.userId = filters.userId;
      if (filters.chatId) whereClause.chatId = filters.chatId;
      if (filters.minImportance) {
        whereClause.importanceScore = { gte: filters.minImportance };
      }
      if (filters.maxAge) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.maxAge);
        whereClause.timestamp = { gte: cutoffDate };
      }
      if (filters.tags && filters.tags.length > 0) {
        whereClause.tags = { hasSome: filters.tags };
      }

      const candidates = await this.prisma.vectorMemory.findMany({
        where: whereClause,
        orderBy: [
          { importanceScore: 'desc' },
          { timestamp: 'desc' }
        ],
        take: Math.min(filters.limit || 100, 1000) // Maksymalnie 1000 kandydatów
      });

      if (candidates.length === 0) {
        return [];
      }

      // 3. Oblicz podobieństwa
      const candidateEmbeddings = candidates.map(candidate => ({
        id: candidate.id,
        embedding: candidate.embedding,
        entry: candidate
      }));

      const similarities = EmbeddingsService.findMostSimilar(
        queryEmbeddingResult.embedding,
        candidateEmbeddings,
        Math.min(filters.limit || 20, 50)
      );

      // 4. Stwórz wyniki z kombinowanym scoringiem
      const results: SearchResult[] = similarities.map(sim => {
        const candidate = candidateEmbeddings.find(c => c.id === sim.id)?.entry;
        if (!candidate) return null;

        // Kombinowany score: podobieństwo semantyczne + ważność + świeżość
        const semanticWeight = 0.6;
        const importanceWeight = 0.3;
        const timeWeight = 0.1;
        
        const daysSinceCreated = (Date.now() - candidate.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        const timeScore = Math.max(0, 1 - (daysSinceCreated / 365)); // Spadek przez rok
        
        const relevanceScore = 
          (sim.similarity * semanticWeight) +
          (candidate.importanceScore * importanceWeight) +
          (timeScore * timeWeight);

        return {
          id: candidate.id,
          content: candidate.content,
          similarity: sim.similarity,
          importanceScore: candidate.importanceScore,
          timestamp: candidate.timestamp,
          tags: candidate.tags,
          context: candidate.context || undefined,
          relevanceScore
        };
      }).filter(Boolean) as SearchResult[];

      // 5. Sortuj po relevanceScore
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log(`🔍 Znaleziono ${results.length} podobnych wpisów dla zapytania: "${query.substring(0, 50)}..."`);
      
      return results;

    } catch (error) {
      console.error('❌ Błąd wyszukiwania w pamięci:', error);
      return [];
    }
  }

  /**
   * Pobiera kontekst z pamięci dla danego użytkownika (GLOBALNE wyszukiwanie)
   */
  public async getMemoryContext(
    query: string,
    userId: string,
    chatId?: string,
    maxTokens: number = 2000
  ): Promise<string> {
    
    // Sprawdź ustawienia użytkownika
    const userSettings = await this.getUserMemorySettings(userId);
    
    if (userSettings?.memoryEnabled === false) {
      console.log(`🚫 Pamięć wyłączona dla użytkownika ${userId}`);
      return '';
    }
    
    const filters: SearchFilters = {
      userId,
      limit: 15,
      minImportance: 0.3
    };
    
    // Sprawdź czy użytkownik chce dzielić pamięć między czatami
    if (userSettings?.shareMemoryAcrossChats === false && chatId) {
      // Ogranicz tylko do aktualnego czatu
      filters.chatId = chatId;
      console.log(`🔒 Wyszukiwanie ograniczone do czatu ${chatId}`);
    } else {
      console.log(`🌐 Globalne wyszukiwanie w pamięci użytkownika ${userId}`);
    }

    const memoryResults = await this.searchMemory(query, filters);
    
    if (memoryResults.length === 0) {
      return '';
    }

    // Buduj kontekst z informacjami o podobieństwie i pochodzeniu
    let context = 'Relevantne informacje z poprzednich rozmów:\n\n';
    let currentLength = context.length;

    for (const result of memoryResults) {
      // Pokaż podobieństwo i tagi dla lepszego zrozumienia
      const similarityPercent = Math.round(result.similarity * 100);
      const tags = result.tags.length > 0 ? ` [${result.tags.join(', ')}]` : '';
      
      const entryText = `• ${result.content}${tags} (podobieństwo: ${similarityPercent}%)`;
      
      if (currentLength + entryText.length > maxTokens) break;
      
      context += entryText + '\n';
      currentLength += entryText.length + 1;
    }

    console.log(`📋 Utworzono kontekst z ${memoryResults.length} wspomnień (${context.length} znaków)`);
    return context.trim();
  }

  /**
   * Pobiera ustawienia pamięci użytkownika
   */
  private async getUserMemorySettings(userId: string) {
    return await this.prisma.memorySettings.findUnique({
      where: { userId }
    });
  }

  /**
   * Egzekwuje limity pamięci użytkownika
   */
  private async enforceMemoryLimits(userId: string): Promise<void> {
    const settings = await this.getUserMemorySettings(userId);
    const maxEntries = settings?.maxMemoryEntries || 10000;

    // Sprawdź obecną liczbę wpisów
    const currentCount = await this.prisma.vectorMemory.count({
      where: { userId }
    });

    if (currentCount >= maxEntries) {
      // Usuń najstarsze, najmniej ważne wpisy
      const toDeleteCount = Math.max(1, Math.floor(maxEntries * 0.1)); // Usuń 10%
      
      const oldEntries = await this.prisma.vectorMemory.findMany({
        where: { userId },
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

        console.log(`🧹 Usunięto ${oldEntries.length} starych wpisów z pamięci użytkownika ${userId}`);
      }
    }
  }

  /**
   * Czyści pamięć zgodnie z polityką retencji
   */
  public async cleanupMemory(userId?: string): Promise<number> {
    try {
      const whereClause: any = {};
      
      if (userId) {
        whereClause.userId = userId;
        const settings = await this.getUserMemorySettings(userId);
        const retentionDays = settings?.retentionDays || 365;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        whereClause.timestamp = { lt: cutoffDate };
      } else {
        // Globalne czyszczenie - usuń wpisy starsze niż 2 lata
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 730);
        whereClause.timestamp = { lt: cutoffDate };
      }

      const result = await this.prisma.vectorMemory.deleteMany({
        where: whereClause
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
  public async deleteMemoryByChat(chatId: string, userId?: string): Promise<number> {
    try {
      const whereClause: any = { chatId };
      if (userId) whereClause.userId = userId;

      const result = await this.prisma.vectorMemory.deleteMany({
        where: whereClause
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
  public async deleteMemoryByMessage(messageId: string, userId?: string): Promise<number> {
    try {
      const whereClause: any = { messageId };
      if (userId) whereClause.userId = userId;

      const result = await this.prisma.vectorMemory.deleteMany({
        where: whereClause
      });

      console.log(`🗑️ Usunięto ${result.count} wpisów pamięci dla wiadomości ${messageId}`);
      return result.count;
    } catch (error) {
      console.error('❌ Błąd usuwania pamięci wiadomości:', error);
      return 0;
    }
  }

  /**
   * Usuwa wszystką pamięć konkretnego użytkownika
   */
  public async deleteAllUserMemory(userId: string): Promise<number> {
    try {
      const result = await this.prisma.vectorMemory.deleteMany({
        where: { userId }
      });

      console.log(`🗑️ Usunięto całą pamięć użytkownika ${userId}: ${result.count} wpisów`);
      return result.count;
    } catch (error) {
      console.error('❌ Błąd usuwania pamięci użytkownika:', error);
      return 0;
    }
  }

  /**
   * Sprawdza spójność pamięci i usuwa osierocone wpisy
   */
  public async validateMemoryConsistency(userId: string): Promise<{
    orphanedEntries: number;
    invalidChats: number;
    invalidMessages: number;
  }> {
    try {
      console.log(`🔍 Sprawdzanie spójności pamięci dla użytkownika ${userId}...`);

      // Znajdź wpisy pamięci bez odpowiadających im czatów
      const orphanedByChat = await this.prisma.vectorMemory.findMany({
        where: {
          userId,
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
          userId,
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
   * Pobiera statystyki pamięci użytkownika
   */
  public async getMemoryStats(userId: string): Promise<{
    totalEntries: number;
    entriesByChat: { chatId: string; count: number; }[];
    topTags: { tag: string; count: number; }[];
    averageImportance: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const totalEntries = await this.prisma.vectorMemory.count({
        where: { userId }
      });

      const entriesByChat = await this.prisma.vectorMemory.groupBy({
        by: ['chatId'],
        where: { userId },
        _count: { id: true }
      });

      const averageImportance = await this.prisma.vectorMemory.aggregate({
        where: { userId },
        _avg: { importanceScore: true }
      });

      const timeRange = await this.prisma.vectorMemory.aggregate({
        where: { userId },
        _min: { timestamp: true },
        _max: { timestamp: true }
      });

      // Policz tagi
      const allMemoryEntries = await this.prisma.vectorMemory.findMany({
        where: { userId },
        select: { tags: true }
      });

      const tagCounts: { [key: string]: number } = {};
      allMemoryEntries.forEach(entry => {
        entry.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
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
    return this.embeddingsService.isReady();
  }
}

export default VectorMemoryService;