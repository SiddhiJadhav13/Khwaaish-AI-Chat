import { products } from "@/data/mock";
import type { Product } from "@/types";

/**
 * Interface representing a future embedding vector representation
 */
export interface ProductVector {
  productId: string;
  embedding: number[];
  metadata: {
    title: string;
    category: string;
    tags: string[];
    dietaryTags: string[];
  };
}

/**
 * Standard Cosine Similarity utility.
 * Calculates the cosine of the angle between two vectors A and B.
 * 
 * Formula: A . B / (||A|| * ||B||)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Serializes a product into a single continuous text string ready for vector embedding.
 * This ensures that title, category, tags, and dietary profiles are captured.
 */
export function getProductSearchText(product: Product): string {
  const parts = [
    product.title,
    `category: ${product.category}`,
    `quantity: ${product.quantityLabel}`,
    `tags: ${(product.tags || []).join(", ")}`,
    `dietary: ${(product.dietaryTags || []).join(", ")}`,
    `meals: ${(product.mealTags || []).join(", ")}`,
  ];
  return parts.join(" | ").toLowerCase();
}

/**
 * Tokenize text into lower-case alphanumeric words for local vector calculations
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s|]/g, "")
    .split(/[\s|]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);
}

/**
 * Generates a local mock high-dimensional embedding vector (TF-IDF bag-of-words style).
 * This allows full local search execution with actual cosine similarity calculation
 * before the system transitions to remote embedding APIs.
 * 
 * FUTURE INTEGRATION NOTE:
 * To use real embeddings:
 * ```typescript
 * const ai = new GoogleGenerativeAI(apiKey);
 * const response = await ai.getGenerativeModel({ model: "text-embedding-004" })
 *    .embedContent(text);
 * return response.embedding.values;
 * ```
 */
export function generateLocalEmbedding(text: string, vocabulary: string[]): number[] {
  const tokens = tokenize(text);
  const counts = new Map<string, number>();
  
  tokens.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));

  // Build high-dimensional vector corresponding to vocabulary indices
  return vocabulary.map((word) => {
    return counts.has(word) ? counts.get(word)! : 0;
  });
}

/**
 * Performs semantic retrieval using cosine similarity over local bag-of-words vectors.
 */
export function semanticSearch(query: string, limit: number = 4): Product[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  // 1. Build a local vocabulary from all products to act as dimensions
  const allSerialized = products.map((p) => getProductSearchText(p));
  const uniqueWords = new Set<string>();
  
  allSerialized.forEach((text) => {
    tokenize(text).forEach((token) => uniqueWords.add(token));
  });
  tokenize(trimmed).forEach((token) => uniqueWords.add(token));
  
  const vocabulary = Array.from(uniqueWords);

  // 2. Compute vectors for all products
  const productVectors = products.map((p, idx) => ({
    product: p,
    vector: generateLocalEmbedding(allSerialized[idx], vocabulary),
  }));

  // 3. Compute vector for the query
  const queryVector = generateLocalEmbedding(trimmed, vocabulary);

  // 4. Calculate cosine similarity and rank
  const scored = productVectors.map((pv) => {
    const score = cosineSimilarity(pv.vector, queryVector);
    return {
      product: pv.product,
      score,
    };
  });

  // Filter out completely unrelated items (score = 0) and sort descending
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);
}
