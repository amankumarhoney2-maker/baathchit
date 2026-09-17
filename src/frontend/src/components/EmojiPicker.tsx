import { cn } from "@/lib/utils";

const EMOJIS = [
  "❤️",
  "😂",
  "👍",
  "🔥",
  "😮",
  "😢",
  "🙏",
  "🎉",
  "😍",
  "🤔",
  "😅",
  "💯",
  "👏",
  "😎",
  "🥳",
  "😭",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  return (
    <div
      data-ocid="emoji_picker"
      className={cn("grid grid-cols-8 gap-1", className)}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          data-ocid={`emoji_picker.${emoji}`}
          aria-label={`React with ${emoji}`}
          onClick={() => onSelect(emoji)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-smooth hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
