interface MemoryEntry {
  id: string;
  content: string;
  keywords: string[];
  timestamp: Date;
  relevanceScore: number;
}

interface KeywordScore {
  keyword: string;
  score: number;
}

class KeywordMemoryService {
  private static instance: KeywordMemoryService;
  private memories: MemoryEntry[] = [];
  private maxMemories: number = 100;

  private constructor() {}

  public static getInstance(): KeywordMemoryService {
    if (!KeywordMemoryService.instance) {
      KeywordMemoryService.instance = new KeywordMemoryService();
    }
    return KeywordMemoryService.instance;
  }

  /**
   * Ekstraktuje słowa kluczowe z tekstu
   */
  private extractKeywords(text: string): string[] {
    // Usuń znaki interpunkcyjne i konwertuj na małe litery
    const cleanText = text.toLowerCase()
      .replace(/[^\w\sąćęłńóśźż]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Podziel na słowa
    const words = cleanText.split(' ');

    // Filtruj stop words (polskie i angielskie)
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
      'i', 'ja', 'ty', 'on', 'ona', 'ono', 'my', 'wy', 'oni', 'one', 'się', 'że', 'do', 'na', 'w', 'z', 'o', 'od', 'po', 'za', 'przed', 'nad', 'pod', 'przez',
      'oraz', 'ale', 'lub', 'czy', 'jak', 'co', 'gdzie', 'kiedy', 'dlaczego', 'który', 'która', 'które', 'jego', 'jej', 'ich', 'mój', 'moja', 'moje', 'twój', 'twoja', 'twoje'
    ]);

    // Filtruj słowa: usuń stop words, krótkie słowa i cyfry
    const keywords = words
      .filter(word => 
        word.length > 2 && 
        !stopWords.has(word) && 
        !/^\d+$/.test(word)
      )
      .filter((word, index, arr) => arr.indexOf(word) === index); // usuń duplikaty

    return keywords.slice(0, 20); // maksymalnie 20 słów kluczowych
  }

  /**
   * Dodaje nową pamięć
   */
  public addMemory(content: string): void {
    if (!content.trim()) return;

    const keywords = this.extractKeywords(content);
    if (keywords.length === 0) return;

    const memory: MemoryEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content: content.trim(),
      keywords,
      timestamp: new Date(),
      relevanceScore: 1.0
    };

    this.memories.unshift(memory);

    // Utrzymuj limit pamięci
    if (this.memories.length > this.maxMemories) {
      this.memories = this.memories.slice(0, this.maxMemories);
    }

    console.log(`💭 Dodano pamięć z ${keywords.length} słowami kluczowymi: ${keywords.slice(0, 5).join(', ')}...`);
  }

  /**
   * Wyszukuje relevantne wspomnienia na podstawie zapytania
   */
  public searchMemories(query: string, limit: number = 5): MemoryEntry[] {
    if (!query.trim()) return [];

    const queryKeywords = this.extractKeywords(query);
    if (queryKeywords.length === 0) return [];

    // Oblicz score dla każdej pamięci
    const scoredMemories = this.memories.map(memory => {
      let score = 0;
      
      // Punkty za dokładne dopasowania słów kluczowych
      for (const qKeyword of queryKeywords) {
        for (const mKeyword of memory.keywords) {
          if (qKeyword === mKeyword) {
            score += 10; // dokładne dopasowanie
          } else if (mKeyword.includes(qKeyword) || qKeyword.includes(mKeyword)) {
            score += 5; // częściowe dopasowanie
          }
        }
      }

      // Bonus za świeżość (nowsze pamięci mają wyższy score)
      const daysSinceCreation = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const freshnessBonus = Math.max(0, 5 - daysSinceCreation); // 5 punktów dla dzisiejszych, 0 dla starszych niż 5 dni
      score += freshnessBonus;

      return { ...memory, searchScore: score };
    });

    // Filtruj tylko te z score > 0 i sortuj malejąco
    return scoredMemories
      .filter(memory => memory.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, limit);
  }

  /**
   * Generuje kontekst dla LLM na podstawie zapytania
   */
  public getRelevantContext(query: string): string {
    const relevantMemories = this.searchMemories(query, 3);
    
    if (relevantMemories.length === 0) {
      return '';
    }

    const contextParts = relevantMemories.map((memory, index) => 
      `[Pamięć ${index + 1}]: ${memory.content}`
    );

    return `\n\n--- KONTEKST Z POPRZEDNICH ROZMÓW ---\n${contextParts.join('\n')}\n--- KONIEC KONTEKSTU ---\n\n`;
  }

  /**
   * Pobiera statystyki pamięci
   */
  public getStats(): { totalMemories: number; totalKeywords: number; oldestMemory?: Date } {
    const totalKeywords = this.memories.reduce((sum, memory) => sum + memory.keywords.length, 0);
    const oldestMemory = this.memories.length > 0 ? this.memories[this.memories.length - 1].timestamp : undefined;

    return {
      totalMemories: this.memories.length,
      totalKeywords,
      oldestMemory
    };
  }

  /**
   * Czyści starsze pamięci (starsze niż określona liczba dni)
   */
  public cleanupOldMemories(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialCount = this.memories.length;
    this.memories = this.memories.filter(memory => memory.timestamp > cutoffDate);
    const removedCount = initialCount - this.memories.length;

    if (removedCount > 0) {
      console.log(`🧹 Usunięto ${removedCount} starych pamięci (starsze niż ${daysOld} dni)`);
    }

    return removedCount;
  }
}

export default KeywordMemoryService;