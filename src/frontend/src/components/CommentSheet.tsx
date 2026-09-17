import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useAddComment,
  useGetUserProfile,
  useListComments,
} from "@/hooks/useQueries";
import { timestampToDate } from "@/lib/utils";
import { Send } from "lucide-react";
import { useState } from "react";

interface CommentSheetProps {
  reelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommentRowProps {
  author: string;
  authorPrincipal: string;
  body: string;
  createdAt: bigint;
  index: number;
}

function CommentRow({
  author,
  authorPrincipal,
  body,
  createdAt,
  index,
}: CommentRowProps) {
  const { identity } = useAuth();
  const callerText = identity?.getPrincipal().toText() ?? "";
  const isOwn = authorPrincipal === callerText;
  const { data: authorProfile } = useGetUserProfile(
    isOwn ? "" : authorPrincipal,
  );
  const showAuthorId = isOwn || authorProfile?.isPublic !== false;
  const authorLabel = showAuthorId
    ? author
    : authorProfile?.username
      ? `@${authorProfile.username}`
      : "Baathchit user";
  const date = timestampToDate(createdAt);

  return (
    <li
      data-ocid={`comment_sheet.item.${index + 1}`}
      className="flex items-start gap-3"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {authorLabel.slice(1, 3).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {authorLabel}
          </span>
          {date && (
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm leading-snug text-foreground/90">{body}</p>
      </div>
    </li>
  );
}

export function CommentSheet({
  reelId,
  open,
  onOpenChange,
}: CommentSheetProps) {
  const [body, setBody] = useState("");
  const { data: comments, isLoading } = useListComments(open ? reelId : "");
  const addComment = useAddComment();

  function submit() {
    const text = body.trim();
    if (!text) return;
    setBody("");
    addComment.mutate(
      { reelId, body: text },
      {
        onError: () => setBody((current) => (current === "" ? text : current)),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-ocid="comment_sheet"
        className="flex h-[70dvh] flex-col rounded-t-3xl border-t-0 bg-card p-0"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-base font-semibold">
            Comments
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => `comment-skeleton-${i}`).map(
                (id) => (
                  <div key={id} className="flex items-start gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : comments && comments.length > 0 ? (
            <ul data-ocid="comment_sheet.list" className="space-y-5">
              {comments.map((comment, index) => (
                <CommentRow
                  key={comment.id}
                  author={comment.author}
                  authorPrincipal={comment.authorPrincipal}
                  body={comment.body}
                  createdAt={comment.createdAt}
                  index={index}
                />
              ))}
            </ul>
          ) : (
            <div
              data-ocid="comment_sheet.empty_state"
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <p className="font-display text-base font-semibold text-foreground">
                No comments yet
              </p>
              <p className="mt-1 max-w-[220px] text-sm text-muted-foreground">
                Be the first to share your thoughts on this reel.
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-3">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              data-ocid="comment_sheet.input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-full bg-muted"
              aria-label="Add a comment"
            />
            <Button
              type="submit"
              data-ocid="comment_sheet.submit_button"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              disabled={!body.trim() || addComment.isPending}
              aria-label="Post comment"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
