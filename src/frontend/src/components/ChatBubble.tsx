import type { ChatMessage, ChatReaction } from "@/lib/types";
import { cn, timestampToDate } from "@/lib/utils";
import { CornerUpLeft, Smile } from "lucide-react";

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  replyPreview?: string;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage) => void;
}

function aggregateReactions(reactions: ChatReaction[]): Array<{
  emoji: string;
  count: number;
}> {
  const counts = new Map<string, number>();
  for (const reaction of reactions) {
    counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([emoji, count]) => ({
    emoji,
    count,
  }));
}

export function ChatBubble({
  message,
  isOwn,
  replyPreview,
  onReply,
  onReact,
}: ChatBubbleProps) {
  const date = timestampToDate(message.createdAt);
  const reactions = aggregateReactions(message.reactions);

  return (
    <div
      data-ocid={`chat_bubble.${message.id}`}
      className={cn(
        "flex w-full flex-col",
        isOwn ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "group relative max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-subtle",
          isOwn
            ? "rounded-br-md bg-gradient-primary text-primary-foreground"
            : "rounded-bl-md bg-card text-card-foreground",
        )}
      >
        {message.replyTo !== undefined && (
          <div
            data-ocid="chat_bubble.reply_indicator"
            className={cn(
              "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs",
              isOwn
                ? "border-primary-foreground/60 bg-primary-foreground/10"
                : "border-primary bg-muted",
            )}
          >
            <span className="font-medium">Replying to</span>
            <p className="line-clamp-1 opacity-80">
              {replyPreview ?? "a message"}
            </p>
          </div>
        )}

        <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
          {message.text}
        </p>

        {date && (
          <span
            className={cn(
              "mt-1 block text-right text-[10px]",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {date.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}

        <div className="mt-1 flex items-center justify-end gap-1 opacity-0 transition-smooth group-hover:opacity-100">
          <button
            type="button"
            data-ocid={`chat_bubble.reply_button.${message.id}`}
            aria-label="Reply to message"
            onClick={() => onReply(message)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-smooth hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CornerUpLeft
              className={cn(
                "h-4 w-4",
                isOwn ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            />
          </button>
          <button
            type="button"
            data-ocid={`chat_bubble.react_button.${message.id}`}
            aria-label="React to message"
            onClick={() => onReact(message)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-smooth hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Smile
              className={cn(
                "h-4 w-4",
                isOwn ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            />
          </button>
        </div>
      </div>

      {reactions.length > 0 && (
        <div
          data-ocid={`chat_bubble.reactions.${message.id}`}
          className={cn(
            "-mt-2 flex flex-wrap gap-1 px-2",
            isOwn ? "justify-end" : "justify-start",
          )}
        >
          {reactions.map((reaction) => (
            <span
              key={reaction.emoji}
              className="flex items-center gap-0.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs shadow-subtle"
            >
              <span>{reaction.emoji}</span>
              <span className="text-muted-foreground">{reaction.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
