interface IntentAnalysisResult {
  useVectorMemory: boolean;
  useChatHistory: boolean;
  confidence: number;
  reasoning: string;
  detectedIntent: 'continuation' | 'reference_to_past' | 'new_topic' | 'unclear';
}

type MemoryAggressiveness = 'conservative' | 'moderate' | 'aggressive';

class IntentAnalyzer {
  
  // Słowa kluczowe wyraźnie wskazujące na potrzebę pamięci z poprzednich rozmów
  private static readonly EXPLICIT_MEMORY_KEYWORDS = [
    'wcześniej', 'poprzednio', 'pamiętasz', 'jak mówiłem', 'jak mówiłam',
    'wracając do', 'odnosząc się do', 'jak wspomniałem', 'jak wspomniałam',
    'z naszej poprzedniej rozmowy', 'z ostatniej rozmowy', 'z wczoraj',
    'z tamtej rozmowy', 'z tamtego czasu', 'jak ostatnio', 'jak wcześniej pisałem',
    'pamiętasz jak', 'czy pamiętasz', 'wspominałeś', 'wspominałaś'
  ];

  // Słowa wskazujące na kontynuację aktualnego tematu
  private static readonly CONTINUATION_KEYWORDS = [
    'więcej', 'dalej', 'jeszcze', 'co jeszcze', 'a co z', 'dodatkowo',
    'poza tym', 'oprócz tego', 'także', 'również', 'inne', 'inny',
    'następny', 'kolejny', 'druga', 'drugi', 'trzeci', 'inna opcja',
    'alternatywa', 'może jeszcze', 'coś jeszcze', 'czy jest coś',
    'rozwiń', 'powiedz więcej', 'opowiedz więcej', 'wyjaśnij więcej'
  ];

  // Słowa wskazujące na nowy temat
  private static readonly NEW_TOPIC_KEYWORDS = [
    'teraz', 'aktualnie', 'dzisiaj', 'obecnie', 'w tej chwili',
    'przejdźmy do', 'zmieńmy temat', 'nowy temat', 'inne pytanie',
    'nowe pytanie', 'coś innego', 'inna sprawa', 'zapomnij o',
    'nie o tym', 'to co innego'
  ];

  // Frazy wskazujące na pierwszą wiadomość w temacie
  private static readonly FIRST_TIME_PATTERNS = [
    /^(czy|jak|co|gdzie|kiedy|dlaczego|w jaki sposób)/i,
    /^(pomóż|pomóc|poradź|wyjaśnij|wytłumacz|pokaż)/i,
    /^(chcę|chciałbym|chciałabym|potrzebuję|szukam)/i,
    /^(jakie są|jakie mogą być|co to jest|czym jest)/i
  ];

  /**
   * Analizuje intencję użytkownika i decyduje o użyciu pamięci
   */
  public static analyzeIntent(
    userMessage: string,
    chatHistoryLength: number,
    aggressiveness: MemoryAggressiveness = 'conservative'
  ): IntentAnalysisResult {
    
    const lowerMessage = userMessage.toLowerCase().trim();
    
    console.log(`🧐 Analizuję intencję: "${userMessage.substring(0, 50)}..." (długość czatu: ${chatHistoryLength})`);

    // 1. Sprawdź czy są wyraźne wskazania na pamięć z poprzednich rozmów
    const hasExplicitMemoryRef = this.EXPLICIT_MEMORY_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );

    if (hasExplicitMemoryRef) {
      return {
        useVectorMemory: true,
        useChatHistory: true,
        confidence: 0.9,
        reasoning: 'Wykryto wyraźne odniesienie do poprzednich rozmów',
        detectedIntent: 'reference_to_past'
      };
    }

    // 2. Sprawdź czy to kontynuacja aktualnego tematu
    const hasContinuationKeywords = this.CONTINUATION_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );

    if (hasContinuationKeywords && chatHistoryLength > 2) {
      return {
        useVectorMemory: false, // Używaj historii czatu, nie globalnej pamięci
        useChatHistory: true,
        confidence: 0.8,
        reasoning: 'Wykryto kontynuację tematu - używam historii czatu',
        detectedIntent: 'continuation'
      };
    }

    // 3. Sprawdź czy to nowy temat
    const hasNewTopicKeywords = this.NEW_TOPIC_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );

    if (hasNewTopicKeywords) {
      return {
        useVectorMemory: false,
        useChatHistory: false,
        confidence: 0.7,
        reasoning: 'Wykryto nowy temat - bez dodatkowego kontekstu',
        detectedIntent: 'new_topic'
      };
    }

    // 4. Sprawdź czy to pierwsza wiadomość w temacie
    const isFirstTimeQuestion = this.FIRST_TIME_PATTERNS.some(pattern => 
      pattern.test(lowerMessage)
    );

    if (isFirstTimeQuestion && chatHistoryLength <= 2) {
      return {
        useVectorMemory: false,
        useChatHistory: false,
        confidence: 0.6,
        reasoning: 'Wygląda na pierwsze pytanie w temacie',
        detectedIntent: 'new_topic'
      };
    }

    // 5. Decyzja na podstawie poziomu agresywności
    return this.decideByAggressiveness(
      userMessage, 
      chatHistoryLength, 
      aggressiveness,
      hasContinuationKeywords
    );
  }

  /**
   * Decyduje o użyciu pamięci na podstawie poziomu agresywności
   */
  private static decideByAggressiveness(
    userMessage: string,
    chatHistoryLength: number,
    aggressiveness: MemoryAggressiveness,
    hasContinuationKeywords: boolean
  ): IntentAnalysisResult {
    
    switch (aggressiveness) {
      case 'conservative':
        // Tylko historia czatu jeśli jest długi
        if (chatHistoryLength > 4) {
          return {
            useVectorMemory: false,
            useChatHistory: true,
            confidence: 0.5,
            reasoning: 'Tryb konserwatywny - tylko historia czatu',
            detectedIntent: 'unclear'
          };
        }
        return {
          useVectorMemory: false,
          useChatHistory: false,
          confidence: 0.4,
          reasoning: 'Tryb konserwatywny - bez dodatkowego kontekstu',
          detectedIntent: 'unclear'
        };

      case 'moderate':
        // Używaj historii czatu lub pamięci przy dwuznaczności
        if (hasContinuationKeywords || chatHistoryLength > 3) {
          return {
            useVectorMemory: false,
            useChatHistory: true,
            confidence: 0.6,
            reasoning: 'Tryb umiarkowany - historia czatu przy dwuznaczności',
            detectedIntent: 'unclear'
          };
        }
        if (userMessage.length > 20) { // Dłuższe pytania mogą wymagać kontekstu
          return {
            useVectorMemory: true,
            useChatHistory: true,
            confidence: 0.4,
            reasoning: 'Tryb umiarkowany - długie pytanie może wymagać kontekstu',
            detectedIntent: 'unclear'
          };
        }
        return {
          useVectorMemory: false,
          useChatHistory: chatHistoryLength > 2,
          confidence: 0.3,
          reasoning: 'Tryb umiarkowany - minimalna pomoc kontekstowa',
          detectedIntent: 'unclear'
        };

      case 'aggressive':
        // Zawsze używaj pamięci (obecne zachowanie)
        return {
          useVectorMemory: true,
          useChatHistory: true,
          confidence: 0.7,
          reasoning: 'Tryb agresywny - zawsze używaj pamięci',
          detectedIntent: 'unclear'
        };

      default:
        return {
          useVectorMemory: false,
          useChatHistory: false,
          confidence: 0.2,
          reasoning: 'Nieznany tryb agresywności',
          detectedIntent: 'unclear'
        };
    }
  }

  /**
   * Sprawdza czy wiadomość zawiera pytania o szczegóły aktualnego tematu
   */
  public static isDetailRequest(userMessage: string): boolean {
    const detailPatterns = [
      /więcej.*szczegół/i,
      /więcej.*informacji/i,
      /więcej.*o.*tym/i,
      /rozwiń.*temat/i,
      /powiedz.*więcej/i,
      /opowiedz.*więcej/i,
      /co.*jeszcze/i,
      /jakie.*inne/i,
      /czy.*jest.*coś.*jeszcze/i
    ];

    return detailPatterns.some(pattern => pattern.test(userMessage));
  }

  /**
   * Sprawdza czy wiadomość zawiera wskazówki czasowe
   */
  public static hasTimeReference(userMessage: string): boolean {
    const timePatterns = [
      /wczoraj/i, /przedwczoraj/i, /ostatnio/i, /niedawno/i,
      /w.*zeszł/i, /miesiąc.*temu/i, /tydzień.*temu/i,
      /kiedyś/i, /dawno.*temu/i, /jakiś.*czas.*temu/i
    ];

    return timePatterns.some(pattern => pattern.test(userMessage));
  }
}

export default IntentAnalyzer;
export type { IntentAnalysisResult, MemoryAggressiveness };