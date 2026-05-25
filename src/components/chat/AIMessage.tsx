import { ChatBubble } from "@/components/chat/ChatBubble";

type AIMessageProps = {
  text: string;
  contextLine?: string;
  timestamp: string;
};

export const AIMessage = ({ text, contextLine, timestamp }: AIMessageProps) => {
  const hasText = text && text.trim().length > 0;

  // Avoid visual redundancy by using the assistant context name as the main title if it is a specific agent role
  const isAgentTitle = contextLine && ["Cart Assistant", "Conversation Brain", "Product Sourcing Help"].includes(contextLine);
  const senderTitle = isAgentTitle ? contextLine : "AI Assistant";
  const subtitle = isAgentTitle ? null : contextLine;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-app-text-muted font-medium">{senderTitle}</span>
      {subtitle ? (
        <span className="text-[11px] text-app-text-muted">{subtitle}</span>
      ) : null}
      {hasText && (
        <ChatBubble sender="ai">
          <p className="leading-relaxed">{text}</p>
        </ChatBubble>
      )}
      {hasText && (
        <span className="text-[11px] text-app-text-muted">{timestamp}</span>
      )}
    </div>
  );
};
