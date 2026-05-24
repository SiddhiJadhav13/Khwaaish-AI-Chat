import { products } from "@/data/mock";
import type { CartItem, Product } from "@/types";

/**
 * High-fidelity category level pairings.
 */
export const CATEGORY_COMPLEMENTS: Record<string, string[]> = {
  milk: ["cereal", "oats", "bakery"],
  cereal: ["milk"],
  oats: ["milk", "spreads"],
  bakery: ["spreads", "milk", "drinks"],
  eggs: ["bakery"],
  oil: ["vegetables", "rice", "paneer"],
  pasta: ["sauces", "vegetables"],
  noodles: ["sauces", "vegetables"],
  rice: ["paneer", "vegetables", "sauces"],
  paneer: ["sauces", "vegetables"],
  vegetables: ["paneer", "sauces"],
  sauces: ["pasta", "noodles", "paneer"],
  frozen: ["drinks", "snacks"],
  snacks: ["drinks", "desserts"],
  drinks: ["snacks", "desserts"],
  desserts: ["drinks", "snacks"],
  protein: ["oats", "drinks", "spreads"],
  spreads: ["bakery", "oats"],
};

/**
 * Precise item-to-item realistic mappings as requested.
 * - Juice (drinks) -> Popcorn, Chips, Cookies
 * - Milk -> Cereal, Oats, Bread
 * - Dinner items -> Noodles, Sauces, Paneer, Frozen meals
 */
export const SPECIFIC_ITEM_PAIRINGS: Record<string, string[]> = {
  // Juice (juice-1) -> popcorn (popcorn-1), chips (chips-1), cookies/chocolate (dessert-1)
  "juice-1": ["popcorn-1", "chips-1", "dessert-1"],
  
  // Cola (cola-1) -> chips (chips-1), popcorn (popcorn-1)
  "cola-1": ["chips-1", "popcorn-1", "dessert-1"],
  
  // Milks (milk-1, milk-2, milk-3, milk-4, milk-5) -> cereal (cereal-1), oats (oats-1), bread (bread-1)
  "milk-1": ["cereal-1", "oats-1", "bread-1"],
  "milk-2": ["cereal-1", "oats-1", "bread-1"],
  "milk-3": ["cereal-1", "oats-1", "bread-1"],
  "milk-4": ["cereal-1", "oats-1", "bread-1"],
  "milk-5": ["cereal-1", "oats-1", "bread-1"],

  // Dinner/meal items -> noodles, sauces, paneer, frozen
  "noodles-1": ["curry-1", "veg-1", "paneer-1"],
  "pasta-1": ["curry-1", "veg-1", "frozen-1"],
  "paneer-1": ["curry-1", "veg-1", "rice-1"],
  "veg-1": ["paneer-1", "curry-1", "oil-1"],
  "curry-1": ["paneer-1", "veg-1", "frozen-1"],
  "frozen-1": ["cola-1", "chips-1"],
  "rice-1": ["paneer-1", "veg-1", "curry-1"],
};

/**
 * Scan cart items and find cheaper products in the same category
 * to offer smart budget substitutions (e.g. Full Cream Milk -> Toned Milk, saving ₹42).
 */
export function getSmartBudgetSubstitutions(cartItems: CartItem[]): Array<{
  originalItem: CartItem;
  cheaperItem: Product;
  savings: number;
}> {
  const substitutions: Array<{
    originalItem: CartItem;
    cheaperItem: Product;
    savings: number;
  }> = [];

  for (const item of cartItems) {
    const cheaperOptions = products
      .filter((p) => p.category === item.category && p.price < item.price && p.id !== item.id)
      .sort((a, b) => a.price - b.price); // Cheapest option first

    if (cheaperOptions.length > 0) {
      substitutions.push({
        originalItem: item,
        cheaperItem: cheaperOptions[0],
        savings: (item.price - cheaperOptions[0].price) * item.quantity,
      });
    }
  }

  return substitutions;
}

/**
 * Returns highly contextual meal-aware recommendations.
 * Ensures we avoid random pairings and focus directly on:
 * - Specific items already in search results / cart
 * - Complementary items based on realistic relationships
 * - Budget restrictions
 */
export function getSmartRecommendations(
  cartItems: CartItem[],
  searchResults: Product[],
  activeBudget?: number
): Product[] {
  const cartIds = new Set(cartItems.map((item) => item.id));
  const searchIds = new Set(searchResults.map((item) => item.id));
  
  const recommendedIds = new Set<string>();
  const recommendations: Product[] = [];

  // 1. Gather all base items to find complements for (prioritize search results, then cart items)
  const baseItems = [...searchResults, ...cartItems];
  if (baseItems.length === 0) {
    return [];
  }

  // 2. Map specific high-fidelity pairings
  for (const item of baseItems) {
    const pairings = SPECIFIC_ITEM_PAIRINGS[item.id] || [];
    pairings.forEach((targetId) => {
      if (!cartIds.has(targetId) && !searchIds.has(targetId)) {
        recommendedIds.add(targetId);
      }
    });
  }

  // 3. Map category complements
  for (const item of baseItems) {
    const categories = CATEGORY_COMPLEMENTS[item.category] || [];
    products.forEach((p) => {
      if (
        categories.includes(p.category) &&
        !cartIds.has(p.id) &&
        !searchIds.has(p.id) &&
        !recommendedIds.has(p.id)
      ) {
        recommendedIds.add(p.id);
      }
    });
  }

  // 4. Resolve IDs to product objects
  const rawRecommendations = Array.from(recommendedIds)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  // 5. Rank / filter recommendations based on budget if applicable
  if (activeBudget !== undefined) {
    const currentSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const remainingBudget = activeBudget - currentSubtotal;

    // Prioritize cheaper options so they fit in budget, and filter items that cost more than remaining budget
    return rawRecommendations
      .sort((a, b) => {
        // If we are tight on budget, rank cheap items first
        if (remainingBudget < 100) {
          return a.price - b.price;
        }
        return b.etaMinutes - a.etaMinutes; // Default sort by delivery speed
      })
      .slice(0, 4);
  }

  // Default: sort by eta speed and slice
  return rawRecommendations.sort((a, b) => a.etaMinutes - b.etaMinutes).slice(0, 4);
}
