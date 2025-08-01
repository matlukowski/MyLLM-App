import { pipeline, env } from '@xenova/transformers';

// Wyłącz lokalne modele - używamy tylko cache
env.allowLocalModels = false;

interface EmbeddingResult {
  embedding: number[];
  error?: string;
}

class EmbeddingsService {
  private static instance: EmbeddingsService;
  private embeddingPipeline: any = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): EmbeddingsService {
    if (!EmbeddingsService.instance) {
      EmbeddingsService.instance = new EmbeddingsService();
    }
    return EmbeddingsService.instance;
  }

  /**
   * Inicjalizuje pipeline do generowania embeddings
   * Używa modelu sentence-transformers/all-MiniLM-L6-v2 (384 wymiary)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Inicjalizacja EmbeddingsService...');
      
      // Używamy lekkiego modelu dla szybkości
      this.embeddingPipeline = await pipeline(
        'feature-extraction', 
        'Xenova/all-MiniLM-L6-v2',
        { 
          progress_callback: (progress: any) => {
            if (progress.status === 'download') {
              console.log(`⬇️ Pobieranie modelu: ${Math.round(progress.progress)}%`);
            }
          }
        }
      );
      
      this.isInitialized = true;
      console.log('✅ EmbeddingsService zainicjalizowany');
    } catch (error) {
      console.error('❌ Błąd inicjalizacji EmbeddingsService:', error);
      throw new Error('Nie udało się zainicjalizować generatora embeddings');
    }
  }

  /**
   * Generuje wektor embeddings dla danego tekstu
   */
  public async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!text || text.trim().length === 0) {
      return { 
        embedding: [], 
        error: 'Pusty tekst' 
      };
    }

    try {
      // Ogranicz długość tekstu (modele mają limity tokenów)
      const truncatedText = text.length > 1000 ? text.substring(0, 1000) : text;
      
      // Generuj embedding
      const output = await this.embeddingPipeline(truncatedText, {
        pooling: 'mean',
        normalize: true,
      });

      // Wyciągnij wektor z rezultatu
      const embedding = Array.from(output.data) as number[];
      
      console.log(`🧠 Wygenerowano embedding (${embedding.length} wymiarów) dla tekstu o długości ${text.length}`);
      
      return { embedding };
    } catch (error) {
      console.error('❌ Błąd generowania embedding:', error);
      return { 
        embedding: [], 
        error: `Błąd generowania embedding: ${error}` 
      };
    }
  }

  /**
   * Generuje embeddings dla wielu tekstów jednocześnie (batch processing)
   */
  public async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results: EmbeddingResult[] = [];
    
    // Przetwarzaj w małych batchach żeby nie przeciążyć pamięci
    const batchSize = 5;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Oblicza podobieństwo kosinusowe między dwoma wektorami
   */
  public static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Wektory muszą mieć tę samą długość');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (magnitude === 0) return 0;
    
    return dotProduct / magnitude;
  }

  /**
   * Znajduje najbardziej podobne wektory do query
   */
  public static findMostSimilar(
    queryEmbedding: number[], 
    candidateEmbeddings: { id: string; embedding: number[]; }[],
    topK: number = 5
  ): { id: string; similarity: number; }[] {
    
    const similarities = candidateEmbeddings.map(candidate => ({
      id: candidate.id,
      similarity: EmbeddingsService.cosineSimilarity(queryEmbedding, candidate.embedding)
    }));

    // Sortuj malejąco po podobieństwie
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, topK);
  }

  /**
   * Sprawdza czy serwis jest gotowy do użycia
   */
  public isReady(): boolean {
    return this.isInitialized && this.embeddingPipeline !== null;
  }
}

export default EmbeddingsService;