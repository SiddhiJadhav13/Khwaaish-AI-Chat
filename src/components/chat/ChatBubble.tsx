import { cn } from "@/lib/utils";
import type { ChatSender } from "@/types";

type ChatBubbleProps = {
  sender: ChatSender;
  children: React.ReactNode;
};

export const ChatBubble = ({ sender, children }: ChatBubbleProps) => {
  const isUser = sender === "user";

  return (
    <div
      className={cn(
        "max-w-[86%] rounded-[22px] px-4 py-3 text-[13px] leading-relaxed shadow-sm",
        isUser
          ? "ml-auto bg-app-primary text-white shadow-[0_8px_18px_rgba(34,197,94,0.25)]"
          : "mr-auto border border-app-border bg-white text-app-text"
      )}
    >
      {children}
    </div>
  );
};
