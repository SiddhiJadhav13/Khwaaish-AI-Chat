import { ChatBubble } from "@/components/chat/ChatBubble";

type AIMessageProps = {
  text: string;
  contextLine?: string;
  timestamp: string;
};

export const AIMessage = ({ text, contextLine, timestamp }: AIMessageProps) => {
  const hasText = text && text.trim().length > 0;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-app-text-muted">AI Assistant</span>
      {contextLine ? (
        <span className="text-[11px] text-app-text-muted">{contextLine}</span>
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
