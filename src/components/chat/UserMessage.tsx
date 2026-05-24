import { ChatBubble } from "@/components/chat/ChatBubble";

type UserMessageProps = {
  text: string;
  timestamp: string;
};

export const UserMessage = ({ text, timestamp }: UserMessageProps) => {
  return (
    <div className="flex flex-col items-end gap-1">
      <ChatBubble sender="user">
        <p className="leading-relaxed">{text}</p>
      </ChatBubble>
      <span className="text-[11px] text-app-text-muted">{timestamp}</span>
    </div>
  );
};
