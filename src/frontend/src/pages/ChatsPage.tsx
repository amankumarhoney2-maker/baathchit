import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetOrCreateConversation,
  useGetUserProfile,
  useListConversations,
} from "@/hooks/useQueries";
import type { ChatConversation } from "@/lib/types";
import { timestampToDate } from "@/lib/utils";
import { Principal } from "@icp-sdk/core/principal";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Plus } from "lucide-react";
import { useState } from "react";

function otherParticipant(
  conversation: ChatConversation,
  caller: Principal,
): Principal {
  return conversation.participantA.toText() === caller.toText()
    ? conversation.participantB
    : conversation.participantA;
}

function displayName(principal: Principal): string {
  const text = principal.toText();
  return text.length > 12 ? `${text.slice(0, 6)}…${text.slice(-4)}` : text;
}

function initial(principal: Principal): string {
  return principal.toText().slice(0, 1).toUpperCase();
}

interface ConversationRowProps {
  conversation: ChatConversation;
  caller: Principal;
  index: number;
}

function ConversationRow({
  conversation,
  caller,
  index,
}: ConversationRowProps) {
  const peer = otherParticipant(conversation, caller);
  const peerText = peer.toText();
  const { data: peerProfile } = useGetUserProfile(peerText);
  const showPeerId = peerProfile?.isPublic !== false;
  const peerLabel = showPeerId
    ? displayName(peer)
    : peerProfile?.username
      ? `@${peerProfile.username}`
      : "Baathchit user";
  const date = timestampToDate(conversation.createdAt);

  return (
    <li key={conversation.id.toString()}>
      <Link
        to="/chats/$conversationId"
        params={{ conversationId: conversation.id.toString() }}
        data-ocid={`chats.item.${index + 1}`}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-smooth hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-lg font-bold">
            {initial(peer)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold">{peerLabel}</p>
          <p className="truncate text-sm text-muted-foreground">
            Private conversation
          </p>
        </div>
        {date && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {date.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </Link>
    </li>
  );
}

export function ChatsPage() {
  const { identity } = useAuth();
  const { data: conversations, isLoading } = useListConversations();
  const getOrCreateConversation = useGetOrCreateConversation();
  const navigate = useNavigate();

  const caller = identity?.getPrincipal();

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [otherPrincipal, setOtherPrincipal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStartChat = () => {
    const text = otherPrincipal.trim();
    if (!text) {
      setError("Enter the other user's principal ID.");
      return;
    }
    if (!caller) {
      setError("You must be signed in to start a chat.");
      return;
    }
    if (text === caller.toText()) {
      setError("You can't start a chat with yourself.");
      return;
    }
    let other: Principal;
    try {
      other = Principal.fromText(text);
    } catch {
      setError("That doesn't look like a valid principal ID.");
      return;
    }
    setError(null);
    getOrCreateConversation.mutate(other, {
      onSuccess: (conversation) => {
        setNewChatOpen(false);
        setOtherPrincipal("");
        void navigate({
          to: "/chats/$conversationId",
          params: { conversationId: conversation.id.toString() },
        });
      },
      onError: () => {
        setError("Couldn't start the chat. Please try again.");
      },
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Chats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your private 1:1 conversations
          </p>
        </div>
        <Button
          type="button"
          data-ocid="chats.new_chat_button"
          onClick={() => setNewChatOpen(true)}
          className="h-10 gap-1.5 rounded-full bg-gradient-primary px-4 text-primary-foreground shadow-elevated hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2 px-4 pt-2">
          {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
            <div
              key={id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div
          data-ocid="chats.empty_state"
          className="flex flex-col items-center justify-center px-6 py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">No chats yet</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            When you start a private conversation, it will show up here.
          </p>
        </div>
      ) : (
        <ul data-ocid="chats.list" className="space-y-2 px-4 pt-2">
          {conversations.map((conversation, index) => {
            if (!caller) return null;
            return (
              <ConversationRow
                key={conversation.id.toString()}
                conversation={conversation}
                caller={caller}
                index={index}
              />
            );
          })}
        </ul>
      )}

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a new chat</DialogTitle>
            <DialogDescription>
              Enter the principal ID of the user you'd like to message. A
              private 1:1 room will be created for the two of you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={otherPrincipal}
              onChange={(e) => {
                setOtherPrincipal(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleStartChat();
                }
              }}
              data-ocid="chats.new_chat_input"
              placeholder="Other user's principal ID"
              className="h-11 rounded-xl border-border bg-background px-4"
            />
            {error && (
              <p
                data-ocid="chats.new_chat_error"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewChatOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-ocid="chats.new_chat_submit"
              onClick={handleStartChat}
              disabled={getOrCreateConversation.isPending}
              className="bg-gradient-primary text-primary-foreground shadow-elevated hover:opacity-90"
            >
              {getOrCreateConversation.isPending ? "Starting..." : "Start chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
