"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SendHorizontal, ShoppingBag, Mic, Sparkles, CheckCircle2 } from "lucide-react";

import { AIMessage } from "@/components/chat/AIMessage";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { SuggestionChip } from "@/components/chat/SuggestionChip";
import { TypingAnimation } from "@/components/chat/TypingAnimation";
import { UserMessage } from "@/components/chat/UserMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetTracker } from "@/components/recommendation/BudgetTracker";
import { moodPresets, quickSuggestions, products } from "@/data/mock";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { buildAiResponse, buildWelcomeMessage } from "@/services/mock-ai";
import { useCartStore } from "@/store/cart";
import { useChatStore } from "@/store/chat";
import { useUIStore } from "@/store/ui";
import { formatPrice } from "@/utils/format";
import { semanticSearch } from "@/services/semantic-search";
import { getSmartRecommendations } from "@/services/recommendation";

export default function Home() {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const { messages, addMessage, isTyping, setTyping } = useChatStore();
  const { items, addItem, updateQuantity, removeItem, clear } = useCartStore();
  const { isCartOpen, setCartOpen, activeMood, setActiveMood, activeBudget, setActiveBudget, requestedItems, addRequestedItem } = useUIStore();

  useAutoScroll(messagesRef, [messages.length, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      addMessage(buildWelcomeMessage());
    }
  }, [addMessage, messages.length]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const freeDeliveryTarget = 400;
  const remainingForFree = Math.max(freeDeliveryTarget - subtotal, 0);
  const progress = Math.min(subtotal / freeDeliveryTarget, 1);

  const feedVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 25 } },
  };

  // Web Speech API Voice Recognition
  const handleMicClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN"; // English (India) is ideal for natural product & currency descriptions

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      const errorType = event.error;
      console.warn("Speech recognition warning/error:", errorType);

      if (errorType === "not-allowed") {
        alert("Microphone permission was denied. Please allow microphone access in your browser settings to use voice input.");
      } else if (errorType === "no-speech") {
        // Benign silence timeout - silently reset recording state
        console.log("No speech detected. Closing voice input gracefully.");
      } else if (errorType !== "aborted") {
        // Log other non-aborted errors to the console in a readable format
        console.error("Speech recognition error details:", errorType);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      if (transcript.trim()) {
        handleSend(transcript);
      }
    };

    recognition.start();
  };

  // Central query processor integrating AI + Semantic Search + Cart Actions + Contextual recommendations
  const handleSend = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Add the User's Message immediately
    addMessage({
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp,
    });

    setInput("");
    setTyping(true);

    try {
      // 2. Fetch Gemini parsed structured intent from backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with LLM API");
      }

      const parsed = await response.json();

      // 3. Execute NLP conversational cart actions automatically
      let cartActionSummary = "";
      if (parsed.cartAction && parsed.cartAction.type) {
        const { type, productId, quantity } = parsed.cartAction;
        const matchedProduct = products.find((p) => p.id === productId);

        if (type === "ADD" && matchedProduct) {
          addItem(matchedProduct, quantity || 1);
          cartActionSummary = `Added ${matchedProduct.title} (x${quantity || 1}) to cart`;
        } else if (type === "REMOVE" && matchedProduct) {
          removeItem(productId);
          cartActionSummary = `Removed ${matchedProduct.title} from cart`;
        } else if (type === "UPDATE_QTY" && matchedProduct) {
          updateQuantity(productId, quantity || 0);
          cartActionSummary = `Set quantity of ${matchedProduct.title} to ${quantity}`;
        } else if (type === "CLEAR") {
          clear();
          cartActionSummary = "Cleared all items from cart";
        }
      }

      // 4. Update budget constraints
      if (parsed.maxPrice) {
        setActiveBudget(parsed.maxPrice);
      }

      // 5. Conduct high-fidelity local semantic retrieval
      const searchResults = parsed.intent === "SEARCH" || parsed.categories.length > 0
        ? semanticSearch(trimmed, 4)
        : undefined;

      // 6. Gather smart category & meal-aware recommendation pairings
      const addOns = getSmartRecommendations(
        useCartStore.getState().items, 
        searchResults || [], 
        parsed.maxPrice || activeBudget
      );

      // 7. Inject AI Response to UI
      const hasSearchResults = searchResults && searchResults.length > 0;
      const isSearchIntent = parsed.intent === "SEARCH";

      if (isSearchIntent && !hasSearchResults) {
        addMessage({
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: `I couldn’t find "${trimmed}" options available right now. Looks like this item may currently be out of stock. Try a similar search or request this product below.`,
          contextLine: "Product Sourcing Help",
          timestamp,
          isFallback: true,
          requestedItemName: trimmed,
          products: undefined,
          addOns: undefined,
          extractedBudget: parsed.maxPrice || undefined,
          cartActionSummary: cartActionSummary || undefined,
          suggestions: [
            `Request "${trimmed}"`,
            "Notify me when available",
            "Try another item"
          ]
        });
      } else {
        addMessage({
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: parsed.reasoning,
          contextLine: parsed.intent === "SEARCH"
            ? (() => {
                const cat = parsed.categories?.[0] || "";
                const lowerQuery = trimmed.toLowerCase();
                if (cat === "sweeteners" || lowerQuery.includes("sugar")) return "Finding sugar products near you.";
                if (cat === "oil" || lowerQuery.includes("oil")) return "Finding cooking oils in stock.";
                if (cat === "milk" || lowerQuery.includes("milk")) return "Checking quick-delivery dairy.";
                if (cat === "drinks" || cat === "juice" || lowerQuery.includes("juice") || lowerQuery.includes("drink")) return "Finding juice products near you.";
                if (lowerQuery.includes("dinner")) return "Checking ready-to-cook items.";
                if (lowerQuery.includes("breakfast")) return "Finding breakfast essentials.";
                if (cat === "frozen" || lowerQuery.includes("frozen")) return "Checking quick frozen foods.";
                if (cat === "fruits" || lowerQuery.includes("mango") || lowerQuery.includes("fruit")) return "Finding mango picks near you. 🥭";
                return `Looking for ${parsed.categories?.join(", ") || "groceries"} 👌`;
              })()
            : "Cart Assistant",
          timestamp,
          products: hasSearchResults ? searchResults : undefined,
          addOns: addOns && addOns.length > 0 ? addOns : undefined,
          extractedBudget: parsed.maxPrice || undefined,
          cartActionSummary: cartActionSummary || undefined,
        });
      }

      setTyping(false);

    } catch (error) {
      console.warn("API error encountered. Executing local keyword-based parsing fallback:", error);
      
      // Fallback: local keyword parsing
      setTimeout(() => {
        const mockResult = buildAiResponse(trimmed, activeMood);
        
        // Match mock outputs to semantic searches for robust visual search results
        const fallbackSearch = semanticSearch(trimmed, 4);
        if (fallbackSearch && fallbackSearch.length > 0) {
          mockResult.products = fallbackSearch;
        }

        mockResult.addOns = getSmartRecommendations(
          useCartStore.getState().items,
          mockResult.products || [],
          activeBudget
        );

        addMessage(mockResult);
        setTyping(false);
      }, 700);
    }
  };

  const bottomPadding = items.length > 0 ? 230 : 155;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,#e2f7ea,transparent_60%)]">
      <div className="mx-auto flex h-screen w-full max-w-[430px] min-w-0 flex-col bg-app-bg/85 shadow-[0_0_50px_rgba(0,0,0,0.06)] border-x border-app-border/40 relative overflow-hidden">
        
        {/* Sleek App Header */}
        <header className="sticky top-0 z-20 bg-app-bg/80 backdrop-blur-md border-b border-app-border/20 flex flex-col">
          <div className="px-4 pb-3 pt-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-app-primary animate-pulse" />
                  <p className="text-[10px] font-bold tracking-wider text-app-primary uppercase">Khwaaish</p>
                </div>
                <h1 className="text-lg font-bold text-app-text tracking-tight mt-0.5">AI Grocery Assistant</h1>
                <p className="text-[11px] text-app-text-muted">
                  Conversational, fast, personalized
                </p>
              </div>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCartOpen(true)}
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-app-border bg-white shadow-[0_6px_20px_rgba(0,0,0,0.04)] cursor-pointer"
              >
                <ShoppingBag size={18} className="text-app-text" />
                {items.length > 0 ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 rounded-full bg-app-primary px-2 py-0.5 text-[9px] font-bold text-white shadow-sm"
                  >
                    {items.reduce((sum, i) => sum + i.quantity, 0)}
                  </motion.span>
                ) : null}
              </motion.button>
            </div>
            
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5 w-full min-w-0">
              {moodPresets.map((mood) => (
                <SuggestionChip
                  key={mood.id}
                  label={mood.label}
                  active={activeMood?.id === mood.id}
                  onClick={() => setActiveMood(mood)}
                />
              ))}
            </div>
          </div>

          {/* Active Budget Indicator - Integrated right underneath the sticky header */}
          <AnimatePresence>
            {activeBudget && <BudgetTracker />}
          </AnimatePresence>
        </header>

        {/* Chat Feed */}
        <main
          ref={messagesRef}
          className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-4 pt-3 space-y-4 min-w-0"
          style={{ paddingBottom: `calc(${bottomPadding}px + env(safe-area-inset-bottom))` }}
        >
          <motion.div
            variants={feedVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                variants={messageVariants}
                className="space-y-2.5 min-w-0 w-full"
              >
                {message.sender === "ai" ? (
                  <AIMessage
                    text={message.text}
                    contextLine={message.contextLine}
                    timestamp={message.timestamp}
                  />
                ) : (
                  <UserMessage text={message.text} timestamp={message.timestamp} />
                )}

                {/* Display auto-execution tags for Cart NLP Actions */}
                {message.cartActionSummary && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 self-start rounded-2xl bg-emerald-50 border border-emerald-100/60 px-3.5 py-1.8 text-[11px] text-emerald-700 font-semibold shadow-sm w-fit"
                  >
                    <CheckCircle2 size={13} className="text-emerald-600 animate-pulse" />
                    {message.cartActionSummary}
                  </motion.div>
                )}

                {/* Empty State / Unavailable Product Sourcing & Recovery CTAs */}
                {message.isFallback && message.requestedItemName && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[22px] border border-dashed border-app-border bg-white p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)] flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="rounded-xl bg-amber-50 p-2 text-amber-600 border border-amber-100">
                        <Sparkles size={14} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-app-text">Item Request & Support</h4>
                        <p className="text-[10.5px] text-app-text-muted mt-0.5 leading-relaxed">
                          We don't stock <strong className="text-app-text font-bold">"{message.requestedItemName}"</strong> in our catalog yet. Sourced items usually arrive in 24 hours.
                        </p>
                      </div>
                    </div>

                    {requestedItems.includes(message.requestedItemName) ? (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 py-2.5 text-xs font-bold text-emerald-700 shadow-xs"
                      >
                        <CheckCircle2 size={14} className="text-emerald-600 animate-bounce" />
                        Product Sourcing Requested!
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            addRequestedItem(message.requestedItemName!);
                          }}
                          className="h-8 rounded-xl font-bold bg-app-primary text-white border border-app-primary flex items-center justify-center gap-1 text-[11px] shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          Request Item
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            addRequestedItem(message.requestedItemName!);
                          }}
                          className="h-8 rounded-xl font-bold border-app-border bg-white text-app-text hover:bg-black/5 flex items-center justify-center gap-1 text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          Notify Me
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-dashed border-app-border pt-2.5 mt-1 text-[10px] text-app-text-muted">
                      <button
                        type="button"
                        onClick={() => alert("Connecting to a store representative... Specialist notified.")}
                        className="hover:text-app-primary font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        💬 Contact Store
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => alert("Connecting to live chat support... Specialist assigned.")}
                        className="hover:text-app-primary font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        📞 Chat with Support
                      </button>
                    </div>
                  </motion.div>
                )}

                {message.products ? (
                  <div className="pt-1">
                    <p className="mb-2 text-xs font-bold text-app-text flex items-center gap-1">
                      <Sparkles size={11} className="text-app-primary" />
                      {message.productSectionTitle || "Matches in Stock"}
                    </p>
                    <ProductCarousel products={message.products} />
                  </div>
                ) : message.isFallback ? (
                  <div className="pt-1">
                    <p className="mb-2 text-xs font-bold text-app-text flex items-center gap-1">
                      <Sparkles size={11} className="text-app-primary" />
                      Matches in Stock
                    </p>
                    <div className="rounded-[22px] border border-app-border bg-black/[0.02] p-4 flex flex-col items-center justify-center text-center gap-1.5">
                      <p className="text-[12px] font-extrabold text-app-text">No items available</p>
                      <p className="text-[10px] text-app-text-muted max-w-[280px]">
                        We couldn't find any products matching your search query in our current catalog.
                      </p>
                    </div>
                  </div>
                ) : null}

                {message.addOns && message.addOns.length > 0 ? (
                  <div className="pt-1">
                    <p className="mb-2 text-[11px] font-bold text-app-text-muted">
                      {message.addOnsSectionTitle || "Pairs well together"}
                    </p>
                    <ProductCarousel products={message.addOns} variant="compact" />
                  </div>
                ) : null}
              </motion.div>
            ))}

            <AnimatePresence>
              {isTyping ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TypingAnimation />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>

      {/* Floating Bottom Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto w-full max-w-[430px] px-4 pb-4 pt-2 bg-gradient-to-t from-app-bg via-app-bg/95 to-transparent flex flex-col gap-2.5">
          
          {/* Floating Premium Capsule Cart Banner (instead of giant static card) */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                key="cart-capsule"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCartOpen(true)}
                className="flex h-13 w-full cursor-pointer items-center justify-between rounded-[22px] bg-gradient-to-r from-emerald-500 to-teal-600 px-4.5 py-3 shadow-[0_12px_28px_rgba(16,185,129,0.25)] hover:shadow-[0_16px_32px_rgba(16,185,129,0.35)] transition-all duration-300 border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
                    <ShoppingBag size={15} className="animate-bounce" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">
                      {items.reduce((sum, i) => sum + i.quantity, 0)} Item{items.reduce((sum, i) => sum + i.quantity, 0) > 1 ? "s" : ""} Added
                    </p>
                    <p className="text-[9px] text-emerald-100/90 font-semibold leading-none mt-0.5">
                      {remainingForFree === 0
                        ? "🎉 Free delivery unlocked!"
                        : `Add ₹${remainingForFree} for free delivery`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-extrabold text-white">{formatPrice(subtotal)}</span>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-white px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm uppercase tracking-wider hover:bg-emerald-50 active:scale-95 transition-all">
                    View Cart
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    >
                      ➔
                    </motion.span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions Tray */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5 w-full min-w-0">
            {quickSuggestions.map((suggestion) => (
              <SuggestionChip
                key={suggestion}
                label={suggestion}
                onClick={() => handleSend(suggestion)}
              />
            ))}
          </div>

          {/* Interactive Chat Input */}
          <div className="flex items-center gap-2 rounded-[22px] border border-white/70 bg-white/85 px-3 py-2 shadow-[0_12px_32px_rgba(17,24,39,0.07)] backdrop-blur-md focus-within:ring-2 focus-within:ring-app-primary/20 transition-all duration-200">
            
            {/* Voice speech recognition button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMicClick}
              className="relative h-10 w-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-all cursor-pointer"
            >
              {isListening ? (
                <>
                  <motion.span
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className="absolute inset-0 rounded-full bg-rose-500/20"
                  />
                  <Mic className="h-5 w-5 text-rose-500" />
                </>
              ) : (
                <Mic className="h-5 w-5 text-app-text-muted hover:text-app-text" />
              )}
            </Button>

            <Input
              placeholder="Ask grocery, e.g. 'vegan milk' or 'under 200'..."
              value={input}
              className="h-10 border-none bg-transparent px-1 shadow-none focus-visible:ring-0 text-[13px] placeholder:text-app-text-muted/60"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSend(input);
                }
              }}
            />
            
            <Button
              size="lg"
              className="h-10 w-10 rounded-full px-0 hover:scale-[1.04] transition-all cursor-pointer"
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
            >
              <SendHorizontal size={17} />
            </Button>
          </div>
        </div>
      </div>

      <CartDrawer />
    </div>
  );
}
