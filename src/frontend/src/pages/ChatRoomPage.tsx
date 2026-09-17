import { ChatBubble } from "@/components/ChatBubble";
import { EmojiPicker } from "@/components/EmojiPicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetUserProfile,
  useListMessages,
  useReactToMessage,
  useSendMessage,
} from "@/hooks/useQueries";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Send, Smile, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function displayName(principal: Principal): string {
  const text = principal.toText();
  return text.length > 12 ? `${text.slice(0, 6)}…${text.slice(-4)}` : text;
}

function initial(principal: Principal): string {
  return principal.toText().slice(0, 1).toUpperCase();
}

export function ChatRoomPage() {
  const { conversationId } = useParams({
    from: "/layout/chats/$conversationId",
  });
  const { identity } = useAuth();
  const caller = identity?.getPrincipal();

  const conversationIdBigInt = useMemo(
    () => BigInt(conversationId),
    [conversationId],
  );

  const { data: messages, isLoading } = useListMessages(conversationIdBigInt);
  const sendMessage = useSendMessage();
  const reactToMessage = useReactToMessage();

  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [reactingTo, setReactingTo] = useState<ChatMessage | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const peer = useMemo(() => {
    if (!caller || !messages || messages.length === 0) return null;
    const first = messages[0];
    return first.sender.toText() === caller.toText() ? null : first.sender;
  }, [caller, messages]);

  const peerText = peer?.toText() ?? "";
  const { data: peerProfile } = useGetUserProfile(peerText);
  const showPeerId = peerProfile?.isPublic !== false;
  const peerLabel = peer
    ? showPeerId
      ? displayName(peer)
      : peerProfile?.username
        ? `@${peerProfile.username}`
        : "Baathchit user"
    : "Conversation";

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastId = messages[messages.length - 1].id.toString();
    if (lastMessageIdRef.current === lastId) return;
    lastMessageIdRef.current = lastId;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const replyPreview = useMemo(() => {
    if (!replyingTo || !messages) return undefined;
    return messages.find((m) => m.id === replyingTo.id)?.text;
  }, [replyingTo, messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const replyTo = replyingTo?.id ?? undefined;
    setDraft("");
    setReplyingTo(null);
    sendMessage.mutate(
      { conversationId: conversationIdBigInt, text, replyTo },
      {
        onError: () => {
          setDraft((current) => (current === "" ? text : current));
        },
      },
    );
  };

  const handleEmojiSelect = (emoji: string) => {
    setEmojiOpen(false);
    setDraft((current) => `${current}${emoji}`);
  };

  const handleReactSelect = (emoji: string) => {
    if (!reactingTo) return;
    setReactOpen(false);
    reactToMessage.mutate({
      conversationId: conversationIdBigInt,
      messageId: reactingTo.id,
      emoji,
    });
    setReactingTo(null);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/90 px-3 py-2.5 backdrop-blur-md">
        <Link
          to="/chats"
          data-ocid="chat_room.back_button"
          aria-label="Back to chats"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-smooth hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-sm font-bold">
            {peer ? initial(peer) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {peer ? (
            <Link
              to="/profile/$principal"
              params={{ principal: peer.toText() }}
              data-ocid="chat_room.peer_profile_link"
              className="block truncate font-display font-semibold transition-smooth hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {peerLabel}
            </Link>
          ) : (
            <p className="truncate font-display font-semibold">{peerLabel}</p>
          )}
          <p className="text-xs text-muted-foreground">Private chat</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((id) => (
              <Skeleton key={id} className="h-12 w-2/3 rounded-2xl" />
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div
            data-ocid="chat_room.empty_state"
            className="flex h-full flex-col items-center justify-center px-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Smile className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-4 font-display text-lg font-semibold">Say hello</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              This is the start of your private conversation.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = caller
              ? message.sender.toText() === caller.toText()
              : false;
            const preview = messages.find(
              (m) => m.id === message.replyTo,
            )?.text;
            return (
              <ChatBubble
                key={message.id.toString()}
                message={message}
                isOwn={isOwn}
                replyPreview={preview}
                onReply={setReplyingTo}
                onReact={(m) => {
                  setReactingTo(m);
                  setReactOpen(true);
                }}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {replyingTo && (
        <div className="flex items-center gap-2 border-t border-border bg-card/80 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary">Replying to</p>
            <p className="truncate text-sm text-muted-foreground">
              {replyPreview ?? "a message"}
            </p>
          </div>
          <button
            type="button"
            data-ocid="chat_room.cancel_reply_button"
            aria-label="Cancel reply"
            onClick={() => setReplyingTo(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-smooth hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="border-t border-border bg-card/90 px-3 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-ocid="chat_room.emoji_button"
                aria-label="Add emoji"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-smooth hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Smile className="h-6 w-6 text-primary" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              className="w-auto border-border bg-popover p-2"
            >
              <EmojiPicker onSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>

          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            data-ocid="chat_room.input"
            placeholder="Type message..."
            className="h-11 flex-1 rounded-full border-border bg-background px-4"
          />

          <Button
            type="button"
            data-ocid="chat_room.send_button"
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            aria-label="Send message"
            className="h-11 w-11 shrink-0 rounded-full bg-gradient-primary p-0 text-primary-foreground shadow-elevated hover:opacity-90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Popover open={reactOpen} onOpenChange={setReactOpen}>
        <PopoverContent
          align="end"
          side="top"
          className="w-auto border-border bg-popover p-2"
        >
          <EmojiPicker onSelect={handleReactSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
