export type Product = {
  id: string;
  title: string;
  category: string;
  quantityLabel: string;
  etaMinutes: number;
  price: number;
  image: string;
  tags?: string[];
  dietaryTags?: string[];
  mealTags?: string[];
};

export type CartItem = Product & {
  quantity: number;
};

export type ChatSender = "user" | "ai";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  contextLine?: string;
  timestamp: string;
  products?: Product[];
  commonPairings?: Product[];
  frequentlyBought?: Product[];
  addOns?: Product[];
  suggestions?: string[];
  moodPrompt?: string;
  extractedBudget?: number;
  cartActionSummary?: string;
  productSectionTitle?: string;
  addOnsSectionTitle?: string;
  isFallback?: boolean;
  requestedItemName?: string;
  fallbackQuery?: string;
};

export type Mood = {
  id: string;
  label: string;
  description: string;
  query: string;
  tags: string[];
};
