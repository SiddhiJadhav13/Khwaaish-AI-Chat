import type { ChatMessage, Mood, Product } from "@/types";
import { products } from "@/data/mock";

type Intent = {
  intent: "SEARCH" | "CART_ACTION" | "CHAT";
  categories: string[];
  dietaryTags: string[];
  keywords: string[];
  maxPrice: number | null;
  preferFast: boolean;
  preferBudget: boolean;
  reasoning: string;
  cartAction: {
    type: "ADD" | "REMOVE" | "UPDATE_QTY" | "CLEAR";
    productId: string | null;
    quantity: number | null;
  } | null;
};

// Vocabulary mapping for strict category matching
const categoryKeywords: Record<string, string[]> = {
  milk: ["milk", "dairy", "toned", "full cream", "organic milk"],
  eggs: ["egg", "eggs", "farm eggs"],
  bakery: ["bread", "bakery", "toast", "bun", "multigrain"],
  snacks: ["snack", "snacks", "chips", "namkeen", "popcorn", "chips pack"],
  drinks: ["drink", "drinks", "cola", "juice", "beverage", "beverages", "cold drink"],
  oil: ["oil", "sunflower", "olive", "mustard", "coconut", "cooking oil"],
  noodles: ["noodle", "noodles", "hakka"],
  pasta: ["pasta", "penne"],
  rice: ["rice", "basmati"],
  paneer: ["paneer", "fresh paneer"],
  vegetables: ["veg", "vegetable", "vegetables", "sabzi", "mixed veg"],
  sauces: ["sauce", "curry", "sauces"],
  frozen: ["frozen", "paratha", "ready meal"],
  cereal: ["cereal", "honey cereal"],
  oats: ["oats", "oatmeal", "rolled oats"],
  desserts: ["dessert", "desserts", "sweet", "chocolate", "chocolate bar"],
  spreads: ["spread", "spreads", "peanut butter", "butter"],
  sweeteners: ["sugar", "sweeteners", "sweetener", "brown sugar", "sugar cubes"],
  fruits: ["mango", "mangoes", "fresh mangoes", "fruit", "fruits", "alphonso"],
  spices: ["spices", "seasoning", "pizza seasoning", "oregano", "chili flakes", "chilly flakes", "herbs"]
};

/**
 * Intelligent local intent and keyword parser
 */
export const parseLocalIntent = (text: string): Intent => {
  const lower = text.toLowerCase();
  
  // Extract budget limit
  let maxPrice: number | null = null;
  const priceMatches = lower.match(/(?:under|below|less than|within|₹|\$|rs\.?\s*)\s*(\d+)/i);
  if (priceMatches && priceMatches[1]) {
    maxPrice = parseInt(priceMatches[1], 10);
  }

  // Extract categories based on strict keywords
  const categories: string[] = [];
  for (const [cat, words] of Object.entries(categoryKeywords)) {
    if (words.some((word) => lower.includes(word))) {
      categories.push(cat);
    }
  }

  // Extract dietary tags
  const dietaryTags: string[] = [];
  if (lower.includes("vegan") || lower.includes("plant-based")) dietaryTags.push("vegan");
  if (lower.includes("lactose") || lower.includes("dairy-free")) dietaryTags.push("lactose-free");
  if (lower.includes("protein") || lower.includes("gym") || lower.includes("workout")) dietaryTags.push("protein");
  if (lower.includes("healthy") || lower.includes("light") || lower.includes("diet")) dietaryTags.push("healthy");

  // Determine intent (CART_ACTION vs SEARCH vs CHAT)
  let intent: "SEARCH" | "CART_ACTION" | "CHAT" = "SEARCH";
  let cartAction: Intent["cartAction"] = null;
  let reasoning = "";

  if (lower.includes("clear") && (lower.includes("cart") || lower.includes("basket"))) {
    intent = "CART_ACTION";
    cartAction = { type: "CLEAR", productId: null, quantity: null };
    reasoning = "I've cleared all the items from your shopping cart.";
  } else if (lower.includes("add") || lower.includes("put") || lower.includes("buy") || lower.includes("shop")) {
    intent = "CART_ACTION";
    // Find matching product in catalog
    const matchedProduct = products.find((p) => lower.includes(p.title.toLowerCase()));
    if (matchedProduct) {
      // Check if user specified a quantity
      const qtyMatch = lower.match(/(\d+)\s+(?:pack|bottle|box|pc|unit)?s?\s*of/);
      const qtyMatch2 = lower.match(/add\s+(\d+)/);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : (qtyMatch2 ? parseInt(qtyMatch2[1], 10) : 1);
      
      cartAction = { type: "ADD", productId: matchedProduct.id, quantity };
      reasoning = `Added ${matchedProduct.title} (x${quantity}) to your shopping cart.`;
    } else {
      // Find by category if no direct product matched
      const matchedCat = categories[0];
      const matchedProductByCat = matchedCat ? products.find((p) => p.category === matchedCat) : null;
      if (matchedProductByCat) {
        cartAction = { type: "ADD", productId: matchedProductByCat.id, quantity: 1 };
        reasoning = `Added ${matchedProductByCat.title} to your cart.`;
      } else {
        intent = "CHAT";
        reasoning = "I'd love to add that to your cart! Which specific product would you like me to add?";
      }
    }
  } else if (lower.includes("remove") || lower.includes("delete") || lower.includes("drop") || lower.includes("take off")) {
    intent = "CART_ACTION";
    const matchedProduct = products.find((p) => lower.includes(p.title.toLowerCase()));
    if (matchedProduct) {
      cartAction = { type: "REMOVE", productId: matchedProduct.id, quantity: null };
      reasoning = `Removed ${matchedProduct.title} from your cart.`;
    } else {
      intent = "CHAT";
      reasoning = "Which item should I remove from your cart?";
    }
  } else if (lower.includes("increase") || lower.includes("decrease") || lower.includes("update") || lower.includes("more") || lower.includes("less") || lower.includes("quantity") || lower.includes("qty")) {
    intent = "CART_ACTION";
    const matchedProduct = products.find((p) => lower.includes(p.title.toLowerCase()));
    if (matchedProduct) {
      const qtyMatch = lower.match(/(\d+)/);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 2;
      cartAction = { type: "UPDATE_QTY", productId: matchedProduct.id, quantity };
      reasoning = `Updated quantity for ${matchedProduct.title} to ${quantity}.`;
    } else {
      intent = "CHAT";
      reasoning = "Which product's quantity would you like me to adjust?";
    }
  } else if (/\b(hi|hello|hey|greetings)\b/i.test(lower) || lower.includes("who are you")) {
    intent = "CHAT";
    reasoning = "Hi! I am your AI grocery assistant. I can search the stock, recommend pairs, manage your cart, and track your budget. Try asking for 'milk' or 'cooking oil under 200'!";
  }

  if (intent === "SEARCH") {
    if (lower.includes("sugar")) {
      reasoning = "Looking for organic sweeteners and sugar options 👌";
    } else if (lower.includes("oil")) {
      reasoning = "Checking quick-delivery cooking oils near you.";
    } else if (lower.includes("milk") || lower.includes("dairy")) {
      reasoning = "Looking for fresh dairy essentials and milk options.";
    } else if (lower.includes("juice") || lower.includes("cola") || lower.includes("drink")) {
      reasoning = "Looking for refreshing drink options 👌";
    } else if (lower.includes("dinner")) {
      reasoning = "Finding quick dinner recommendations for you.";
    } else if (lower.includes("breakfast")) {
      reasoning = "Looking for breakfast cereals and nutritious oats.";
    } else if (lower.includes("frozen") || lower.includes("paratha") || lower.includes("ready meal")) {
      reasoning = "Finding quick-cook frozen foods and parathas.";
    } else if (lower.includes("chili") || lower.includes("chilly") || lower.includes("oregano") || lower.includes("seasoning") || lower.includes("spice")) {
      reasoning = "Looking for organic pizza seasonings and chili flakes 👌";
    } else {
      reasoning = `Checking available catalog items matching "${text}" near you.`;
    }
  }

  // Tokenize keywords
  const keywords = lower
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  return {
    intent,
    categories,
    dietaryTags,
    keywords,
    maxPrice,
    preferFast: /fast|quick|soon|asap|express/.test(lower),
    preferBudget: /cheap|budget|low price|lowest|saving/.test(lower),
    reasoning,
    cartAction
  };
};

/**
 * Filter products strictly matching the parsed category keywords
 */
export const filterStrictRelevance = (intent: Intent): Product[] => {
  // If a category was matched (e.g. "oil", "sugar", "milk"), strictly restrict products to those categories!
  if (intent.categories.length > 0) {
    return products.filter((product) => {
      // Strictly match categories to avoid showing unrelated products like chips for "oil"
      const matched = intent.categories.includes(product.category);
      
      // Price filters
      if (intent.maxPrice !== null && product.price > intent.maxPrice) {
        return false;
      }
      
      // Dietary filter
      if (intent.dietaryTags.length > 0) {
        return matched && product.dietaryTags?.some((tag) => intent.dietaryTags.includes(tag));
      }
      
      return matched;
    });
  }

  // Fallback keyword string match on title and tags
  return products.filter((product) => {
    const titleLower = product.title.toLowerCase();
    const hasKeyword = intent.keywords.some((keyword) => titleLower.includes(keyword) || product.category.includes(keyword));
    
    if (!hasKeyword) return false;
    if (intent.maxPrice !== null && product.price > intent.maxPrice) return false;
    
    if (intent.dietaryTags.length > 0) {
      return product.dietaryTags?.some((tag) => intent.dietaryTags.includes(tag));
    }
    
    return true;
  });
};

/**
 * Generates custom conversational sentences based on the query to make the AI feel real
 */
const getContextualReply = (query: string, count: number, hasBudget: boolean, budgetVal: number | null): string => {
  const lower = query.toLowerCase();
  
  if (lower.includes("sugar")) {
    return "Here are some sugar essentials available. I found regular and low-calorie organic options for your kitchen.";
  }
  if (lower.includes("oil")) {
    return `Here are cooking oil options with quick delivery. ${hasBudget ? `All filtered strictly under ₹${budgetVal} to respect your budget!` : "Perfect for your daily cooking needs."}`;
  }
  if (lower.includes("milk") || lower.includes("dairy")) {
    return "Showing popular dairy essentials. Fresh toned milk, full cream milk, and dairy-free vegan alternatives ready to ship!";
  }
  if (lower.includes("dinner")) {
    return "Here are some quick dinner recommendations. These ready-to-cook bases, noodles, and staples can be prepared in minutes!";
  }
  if (lower.includes("breakfast")) {
    return "I found some delicious breakfast essentials to kickstart your morning with full energy!";
  }
  if (lower.includes("snack") || lower.includes("chips") || lower.includes("popcorn")) {
    return "Here are popular snack picks. Perfect for munching, movie nights, or quick evening cravings!";
  }
  if (lower.includes("juice") || lower.includes("cola") || lower.includes("drink")) {
    return "Showing cold, refreshing beverages and juice options available for express delivery.";
  }
  if (lower.includes("frozen") || lower.includes("paratha") || lower.includes("ready meal")) {
    return "Showing popular frozen snacks and ready-to-cook items. Perfect for quick and delicious meals, ready in minutes!";
  }
  if (lower.includes("mango") || lower.includes("fruit")) {
    return "Here are some mango options available 🥭 I found fresh Alphonso mangoes and refreshing mango-based drinks near you.";
  }
  
  if (count === 0) {
    return `I couldn't find exact matches for "${query}" in our current stock, but I found some excellent similar products you might like!`;
  }
  
  return `I found some great options matching your request. Let me know if you would like me to add any of these to your cart!`;
};

/**
 * Assigns smart dynamic titles to the carousel sections based on user intent
 */
const getSmartTitles = (query: string, matchedCategory: string | undefined) => {
  const lower = query.toLowerCase();
  let productTitle = "Matches in Stock";
  let addOnsTitle = "Pairs well together";

  if (lower.includes("milk") || matchedCategory === "milk") {
    productTitle = "Dairy Products";
    addOnsTitle = "Breakfast Add-ons";
  } else if (lower.includes("oil") || matchedCategory === "oil") {
    productTitle = "Cooking Essentials";
    addOnsTitle = "Kitchen Staples";
  } else if (lower.includes("sugar") || matchedCategory === "sweeteners") {
    productTitle = "Sweetener Basics";
    addOnsTitle = "Pairs well with sweeteners";
  } else if (lower.includes("dinner")) {
    productTitle = "Dinner Recommendations";
    addOnsTitle = "Dinner Accompaniments";
  } else if (lower.includes("breakfast")) {
    productTitle = "Breakfast Choices";
    addOnsTitle = "Pairs with breakfast";
  } else if (lower.includes("snack") || matchedCategory === "snacks") {
    productTitle = "Snack Picks";
    addOnsTitle = "Movie Night Pairings";
  } else if (lower.includes("juice") || lower.includes("drink") || matchedCategory === "drinks") {
    productTitle = "Popular Juice & Drinks";
    addOnsTitle = "Pairs with beverages";
  } else if (lower.includes("frozen") || matchedCategory === "frozen") {
    productTitle = "Frozen Food Essentials";
    addOnsTitle = "Pairs with frozen meals";
  } else if (lower.includes("mango") || matchedCategory === "fruits") {
    productTitle = "Mango Picks 🥭";
    addOnsTitle = "Refreshing Add-ons";
  }

  return { productTitle, addOnsTitle };
};

/**
 * Selects highly realistic and human-like add-ons based on the main matched products
 */
const getContextualAddOns = (mainProducts: Product[]): Product[] => {
  if (mainProducts.length === 0) return [];
  const primaryCat = mainProducts[0].category;

  // Specific high-fidelity human pairings:
  if (primaryCat === "drinks") {
    // Juice / beverages pairs with snacks (popcorn, chips, chocolate)
    return products.filter((p) => p.id === "popcorn-1" || p.id === "chips-1" || p.id === "dessert-1");
  }
  if (primaryCat === "milk" || primaryCat === "sweeteners") {
    // Milk / sweeteners pairs with cereal, oats, bread
    return products.filter((p) => p.id === "cereal-1" || p.id === "oats-1" || p.id === "bread-1");
  }
  if (["noodles", "pasta", "rice", "paneer", "vegetables", "oil"].includes(primaryCat)) {
    // Cooking/dinner items pair with sauces (curry), mixed veg, oil
    return products.filter((p) => p.id === "curry-1" || p.id === "veg-1" || p.id === "oil-1");
  }
  if (primaryCat === "snacks") {
    // Snacks pair with cold drinks (cola) or desserts
    return products.filter((p) => p.id === "cola-1" || p.id === "dessert-1" || p.id === "juice-1");
  }
  if (primaryCat === "fruits" || mainProducts.some(p => p.id.includes("mango"))) {
    // Mango / fruits pair with Greek Yogurt (yogurt-1), Vanilla Ice Cream (dessert-2), Almond Milk (milk-4), and Oats (oats-1)
    return products.filter((p) => p.id === "yogurt-1" || p.id === "dessert-2" || p.id === "milk-4" || p.id === "oats-1");
  }

  // Fallback: general high-quality staple pairings
  return products.filter((p) => p.id === "milk-2" || p.id === "bread-1").slice(0, 2);
};

/**
 * Client-side local brain compiler
 */
export const buildAiResponse = (
  userText: string,
  mood?: Mood
): ChatMessage => {
  const trimmed = userText.trim();
  const intent = parseLocalIntent(trimmed);

  // Parse cart actions (ADD, REMOVE, UPDATE_QTY, CLEAR)
  if (intent.intent === "CART_ACTION") {
    return {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: intent.reasoning,
      contextLine: "Cart Assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cartActionSummary: intent.reasoning,
      suggestions: ["View my cart", "Add something else", "Check budget"]
    };
  }

  // Chat conversational response
  if (intent.intent === "CHAT") {
    return {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: intent.reasoning,
      contextLine: "Conversation Brain",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: ["Weekly groceries", "Healthy breakfast", "Quick dinner"]
    };
  }

  // Search intent
  const strictlyRelevant = filterStrictRelevance(intent);
  const mainResults = strictlyRelevant.slice(0, 4);

  // Build titles and details
  const matchedCategory = mainResults[0]?.category;
  const { productTitle, addOnsTitle } = getSmartTitles(trimmed, matchedCategory);
  const addOns = getContextualAddOns(mainResults);

  // Set small reasoning line for transparency
  let reasoningLine = "Showing matching products";
  if (intent.categories.length > 0) {
    reasoningLine = `Showing quick-delivery ${intent.categories.join("/")} essentials.`;
  }
  if (intent.maxPrice !== null) {
    reasoningLine = `Filtered strictly under ₹${intent.maxPrice}.`;
  }
  if (intent.preferFast) {
    reasoningLine = "Prioritized for express 10-minute delivery.";
  }
  if (trimmed.toLowerCase().includes("snack")) {
    reasoningLine = "Popular evening snack picks.";
  }

  // Handle empty state & fallback experience beautifully
  if (mainResults.length === 0) {
    const honestMessage = `I couldn’t find "${trimmed}" options available right now. Looks like this item may currently be out of stock. Try a similar search or request this product.`;

    return {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: honestMessage,
      contextLine: "Product Sourcing Help",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isFallback: true,
      requestedItemName: trimmed,
      suggestions: [
        `Request "${trimmed}"`,
        "Notify me when available",
        "Try another item"
      ]
    };
  }

  // Success response
  const textResponse = getContextualReply(trimmed, mainResults.length, intent.maxPrice !== null, intent.maxPrice);
  
  return {
    id: `ai-${Date.now()}`,
    sender: "ai",
    text: textResponse,
    contextLine: reasoningLine,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    products: mainResults,
    productSectionTitle: productTitle,
    addOns: addOns,
    addOnsSectionTitle: addOnsTitle,
    extractedBudget: intent.maxPrice || undefined,
    suggestions: [
      `Add ${mainResults[0].title} to cart`,
      "Show cheap pairings",
      "Proceed to checkout"
    ]
  };
};

/**
 * Clean onboarding message
 */
export const buildWelcomeMessage = (): ChatMessage => {
  return {
    id: "ai-welcome",
    sender: "ai",
    text: "Hi! I am your Khwaaish AI Grocery Assistant. Tell me what ingredients or items you are looking for (e.g. 'fresh milk' or 'cooking oil under 200') or speak/type commands to manage your cart!",
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    suggestions: [
      "Add milk and bread",
      "Healthy breakfast",
      "Quick dinner",
      "Party snacks",
    ],
  };
};
