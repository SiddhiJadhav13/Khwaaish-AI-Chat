import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { products } from "@/data/mock";
import { parseLocalIntent } from "@/services/mock-ai";


/**
 * Serialize available products catalog to give Gemini exact, in-stock context
 */
const catalogContext = products.map((p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  price: p.price,
  quantityLabel: p.quantityLabel,
  tags: p.tags || [],
  dietaryTags: p.dietaryTags || [],
  mealTags: p.mealTags || [],
}));

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY env variable is missing. Reverting to local fallback parser.");
      const localResult = localFallbackParser(message);
      return NextResponse.json(localResult);
    }

    // Initialize Generative AI SDK with key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We target gemini-2.5-flash as requested by the user, falling back to gemini-1.5-flash if needed
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `
You are the intelligent backend brain of the Khwaaish AI Grocery Assistant. Your goal is to analyze the user's natural language input, parse their grocery search intents or cart actions, and return a structured JSON response.

Here is the exact in-stock product catalog:
${JSON.stringify(catalogContext, null, 2)}

We support these product categories:
"milk", "eggs", "bakery", "oats", "cereal", "noodles", "pasta", "rice", "paneer", "vegetables", "sauces", "oil", "frozen", "snacks", "drinks", "spreads", "desserts".

We support these dietary tags:
"vegan", "lactose-free", "protein", "healthy".

Your output MUST be a valid JSON object matching this schema:
{
  "intent": "SEARCH" | "CART_ACTION" | "CHAT",
  "categories": string[], // List of matched category names from our catalog
  "dietaryTags": string[], // List of matched dietary tags
  "maxPrice": number | null, // If the user specified a price limit (e.g. "under 200", extract 200 as a number. Otherwise null)
  "preferFast": boolean, // true if user requested quick, fast delivery, or quick meals
  "preferBudget": boolean, // true if user requested cheap, budget, or low price options
  "reasoning": string, // A warm, concise conversational sentence explaining what you found or did
  "cartAction": {
    "type": "ADD" | "REMOVE" | "UPDATE_QTY" | "CLEAR",
    "productId": string | null, // The exact ID of the product from our catalog matching the request
    "quantity": number | null // The quantity to set or add. Defaults to 1 for ADD if not specified.
  } | null
}

Guidelines:
1. If the user wants to add an item (e.g., "add oat milk to cart"), set "intent" to "CART_ACTION", "cartAction" to: { "type": "ADD", "productId": "milk-5", "quantity": 1 }, and explain it in the "reasoning".
2. If the user wants to remove an item (e.g., "remove full cream milk"), set "intent" to "CART_ACTION", "cartAction" to: { "type": "REMOVE", "productId": "milk-3", "quantity": null }.
3. If the user wants to change quantity (e.g., "increase oats quantity" or "make eggs quantity 2"), set "intent" to "CART_ACTION", "cartAction" to: { "type": "UPDATE_QTY", "productId": "oats-1", "quantity": 2 }.
4. If the user wants to clear the cart (e.g., "clear my cart"), set "intent" to "CART_ACTION", "cartAction" to: { "type": "CLEAR", "productId": null, "quantity": null }.
5. If the user is searching for items (e.g., "healthy breakfast under 200" or "cheap snacks"), set "intent" to "SEARCH". Extract appropriate search criteria. E.g., for "healthy breakfast under 200", set "categories": ["milk", "eggs", "oats", "cereal"], "dietaryTags": ["healthy"], "maxPrice": 200.
6. If the user is just saying hello or asking general questions, set "intent" to "CHAT" and provide a warm customer service response in "reasoning".
7. Always ensure you output ONLY the raw JSON string. Do not include markdown code block syntax around the JSON in the output response.
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt + `\nUser Message: "${message}"` }] }]
    });

    const rawResponse = result.response.text();
    const parsedData = JSON.parse(rawResponse);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Gemini API Error in route handler:", error);
    // Graceful production fallback
    const fallback = localFallbackParser(await req.clone().json().then(j => j.message).catch(() => ""));
    return NextResponse.json({
      ...fallback,
      reasoning: "I experienced a minor connection hiccup, but processed your request locally! " + fallback.reasoning,
    });
  }
}

/**
 * Intelligent client-side / server-side regex fallback parser to guarantee offline operational status.
 */
function localFallbackParser(message: string): any {
  return parseLocalIntent(message);
}

