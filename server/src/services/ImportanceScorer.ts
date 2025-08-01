interface ImportanceFactors {
  lengthScore: number;
  keywordScore: number;
  contextScore: number;
  timeScore: number;
  interactionScore: number;
}

interface ImportanceResult {
  score: number;
  factors: ImportanceFactors;
  tags: string[];
  reasoning: string;
}

class ImportanceScorer {
  // Kluczowe słowa i frazy o różnych wagach
  private static readonly IMPORTANCE_KEYWORDS = {
    // Bardzo ważne - osobiste informacje
    personal: {
      weight: 0.8,
      keywords: [
        'nazywam się', 'mam na imię', 'jestem', 'pracuję jako', 'studiuję',
        'moja praca', 'mój zawód', 'moja rodzina', 'mój adres', 'mieszkam',
        'urodziłem się', 'mam lat', 'jestem z', 'pochodzę z'
      ]
    },
    
    // Ważne - preferencje i decyzje
    preferences: {
      weight: 0.7,
      keywords: [
        'lubię', 'nie lubię', 'preferuję', 'wolę', 'uwielbiam', 'nienawidzę',
        'moja ulubiona', 'mój ulubiony', 'zawsze', 'nigdy', 'zwykle',
        'decyduję', 'postanawiam', 'chcę', 'nie chcę', 'planuję'
      ]
    },
    
    // Średnio ważne - fakty i informacje
    facts: {
      weight: 0.6,
      keywords: [
        'pamiętaj', 'ważne', 'istotne', 'kluczowe', 'główne', 'podstawowe',
        'problem', 'rozwiązanie', 'błąd', 'sukces', 'osiągnięcie',
        'deadline', 'termin', 'spotkanie', 'prezentacja'
      ]
    },
    
    // Projekty i cele
    projects: {
      weight: 0.65,
      keywords: [
        'projekt', 'aplikacja', 'system', 'kod', 'programowanie',
        'implementacja', 'funkcjonalność', 'feature', 'bug', 'fix',
        'cel', 'zadanie', 'todo', 'plan', 'strategia'
      ]
    },

    // Pytania i problemy
    questions: {
      weight: 0.5,
      keywords: [
        'jak', 'dlaczego', 'co', 'gdzie', 'kiedy', 'czy', 'który',
        'pomóż', 'pomoc', 'wyjaśnij', 'wytłumacz', 'pokaż',
        'nie rozumiem', 'nie wiem', 'problem z'
      ]
    }
  };

  // Wzorce do automatycznego tagowania
  private static readonly TAG_PATTERNS = [
    { pattern: /\b(javascript|typescript|react|node|npm|yarn)\b/gi, tag: 'programowanie' },
    { pattern: /\b(python|django|flask|pandas|numpy)\b/gi, tag: 'python' },
    { pattern: /\b(projekt|aplikacja|system|kod)\b/gi, tag: 'projekt' },
    { pattern: /\b(spotkanie|prezentacja|deadline|termin)\b/gi, tag: 'praca' },
    { pattern: /\b(rodzina|przyjaciel|żona|mąż|dziecko|rodzice)\b/gi, tag: 'osobiste' },
    { pattern: /\b(lubię|preferuję|wolę|nienawidzę)\b/gi, tag: 'preferencje' },
    { pattern: /\b(błąd|problem|bug|issue)\b/gi, tag: 'problem' },
    { pattern: /\b(sukces|osiągnięcie|ukończone|gotowe)\b/gi, tag: 'sukces' },
    { pattern: /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}:\d{2})\b/g, tag: 'data-czas' }
  ];

  /**
   * Oblicza ocenę ważności dla wiadomości
   */
  public static calculateImportance(
    content: string,
    context: string = '',
    isUserMessage: boolean = true,
    messageLength: number = 0
  ): ImportanceResult {
    
    const actualLength = messageLength || content.length;
    
    // 1. Ocena długości (dłuższe wiadomości są potencjalnie ważniejsze)
    const lengthScore = this.calculateLengthScore(actualLength);
    
    // 2. Ocena na podstawie kluczowych słów
    const keywordScore = this.calculateKeywordScore(content);
    
    // 3. Ocena kontekstowa (czy nawiązuje do poprzednich wiadomości)
    const contextScore = this.calculateContextScore(content, context);
    
    // 4. Ocena czasowa (nowsze wiadomości mogą być ważniejsze)
    const timeScore = 0.6; // Bazowa wartość dla nowych wiadomości
    
    // 5. Ocena typu interakcji
    const interactionScore = this.calculateInteractionScore(content, isUserMessage);
    
    // Oblicz końcową ocenę jako średnią ważoną
    const weights = {
      length: 0.15,
      keyword: 0.35,
      context: 0.2,
      time: 0.1,
      interaction: 0.2
    };
    
    const totalScore = 
      (lengthScore * weights.length) +
      (keywordScore * weights.keyword) +
      (contextScore * weights.context) +
      (timeScore * weights.time) +
      (interactionScore * weights.interaction);
    
    // Normalizuj wynik do zakresu 0-1
    const normalizedScore = Math.max(0, Math.min(1, totalScore));
    
    // Generuj tagi
    const tags = this.generateTags(content);
    
    // Stwórz uzasadnienie
    const reasoning = this.generateReasoning({
      lengthScore,
      keywordScore,
      contextScore,
      timeScore,
      interactionScore
    }, tags);
    
    return {
      score: normalizedScore,
      factors: {
        lengthScore,
        keywordScore,
        contextScore,
        timeScore,
        interactionScore
      },
      tags,
      reasoning
    };
  }

  /**
   * Ocena na podstawie długości wiadomości
   */
  private static calculateLengthScore(length: number): number {
    if (length < 20) return 0.1;
    if (length < 50) return 0.3;
    if (length < 100) return 0.5;
    if (length < 200) return 0.7;
    if (length < 500) return 0.8;
    return 0.9; // Bardzo długie wiadomości
  }

  /**
   * Ocena na podstawie kluczowych słów
   */
  private static calculateKeywordScore(content: string): number {
    const lowerContent = content.toLowerCase();
    let maxScore = 0;
    let matchCount = 0;

    // Sprawdź każdą kategorię kluczowych słów
    for (const [category, data] of Object.entries(this.IMPORTANCE_KEYWORDS)) {
      for (const keyword of data.keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          maxScore = Math.max(maxScore, data.weight);
          matchCount++;
        }
      }
    }

    // Bonus za wiele trafień
    const matchBonus = Math.min(0.2, matchCount * 0.05);
    
    return Math.min(1, maxScore + matchBonus);
  }

  /**
   * Ocena kontekstowa - czy nawiązuje do poprzednich wiadomości
   */
  private static calculateContextScore(content: string, context: string): number {
    if (!context || context.length === 0) return 0.3;
    
    const contentWords = content.toLowerCase().split(/\s+/);
    const contextWords = context.toLowerCase().split(/\s+/);
    
    // Znajdź wspólne słowa (pomijając bardzo krótkie)
    const commonWords = contentWords.filter(word => 
      word.length > 3 && contextWords.includes(word)
    );
    
    const overlapRatio = commonWords.length / Math.max(contentWords.length, 1);
    
    // Bonus za odniesienia do poprzednich wiadomości
    const referenceBonus = content.match(/\b(wcześniej|poprzednio|jak mówiłem|pamiętasz)\b/gi) ? 0.2 : 0;
    
    return Math.min(1, overlapRatio * 2 + referenceBonus);
  }

  /**
   * Ocena typu interakcji
   */
  private static calculateInteractionScore(content: string, isUserMessage: boolean): number {
    const lowerContent = content.toLowerCase();
    
    // Wiadomości użytkownika są z reguły ważniejsze
    let baseScore = isUserMessage ? 0.6 : 0.4;
    
    // Pytania są ważne
    if (lowerContent.match(/[?？]/g)) {
      baseScore += 0.2;
    }
    
    // Instrukcje i polecenia
    if (lowerContent.match(/\b(zrób|stwórz|napisz|wykonaj|pomóż|pokaż)\b/g)) {
      baseScore += 0.15;
    }
    
    // Informacje osobiste
    if (lowerContent.match(/\b(jestem|mam|mieszkam|pracuję)\b/g)) {
      baseScore += 0.25;
    }
    
    return Math.min(1, baseScore);
  }

  /**
   * Generuje tagi na podstawie zawartości
   */
  private static generateTags(content: string): string[] {
    const tags: string[] = [];
    
    for (const pattern of this.TAG_PATTERNS) {
      if (pattern.pattern.test(content)) {
        tags.push(pattern.tag);
      }
    }
    
    // Usuń duplikaty
    return [...new Set(tags)];
  }

  /**
   * Generuje tekstowe uzasadnienie oceny
   */
  private static generateReasoning(factors: ImportanceFactors, tags: string[]): string {
    const reasons: string[] = [];
    
    if (factors.lengthScore > 0.7) {
      reasons.push('długa wiadomość');
    }
    
    if (factors.keywordScore > 0.6) {
      reasons.push('zawiera ważne słowa kluczowe');
    }
    
    if (factors.contextScore > 0.5) {
      reasons.push('nawiązuje do kontekstu');
    }
    
    if (factors.interactionScore > 0.7) {
      reasons.push('ważny typ interakcji');
    }
    
    if (tags.length > 0) {
      reasons.push(`tagi: ${tags.join(', ')}`);
    }
    
    return reasons.length > 0 ? reasons.join('; ') : 'standardowa wiadomość';
  }

  /**
   * Sprawdza czy wiadomość powinna zostać zapisana w pamięci
   */
  public static shouldStoreInMemory(score: number, threshold: number = 0.3): boolean {
    return score >= threshold;
  }
}

export default ImportanceScorer;