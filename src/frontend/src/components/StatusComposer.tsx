import { useAddStatus } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_LENGTH = 280;

export function StatusComposer({ onPosted }: { onPosted?: () => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addStatus = useAddStatus();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const trimmed = text.trim();
  const overLimit = text.length > MAX_LENGTH;
  const canPost = trimmed.length > 0 && !overLimit && !addStatus.isPending;

  const handleSubmit = () => {
    if (!canPost) return;
    const capturedText = trimmed;
    const capturedFile = file;
    setText("");
    setProgress(0);
    setError(null);
    addStatus.mutate(
      {
        text: capturedText,
        file: capturedFile,
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          setFile(null);
          setProgress(0);
          onPosted?.();
        },
        onError: () => {
          setText((current) => (current === "" ? capturedText : current));
          setFile((current) => current ?? capturedFile);
          setError("Could not post your status. Please try again.");
        },
      },
    );
  };

  return (
    <div
      data-ocid="status.composer"
      className="rounded-2xl border border-border bg-card p-4 shadow-subtle"
    >
      <label
        htmlFor="status-composer-text"
        className="font-display text-sm font-semibold text-foreground"
      >
        Share a status or note
      </label>
      <textarea
        id="status-composer-text"
        data-ocid="status.textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder="What's on your mind?"
        className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {previewUrl ? (
        <div
          data-ocid="status.image_preview"
          className="relative mt-3 overflow-hidden rounded-xl border border-border"
        >
          <img
            src={previewUrl}
            alt="Selected attachment preview"
            className="max-h-56 w-full object-cover"
          />
          <button
            type="button"
            data-ocid="status.remove_image_button"
            aria-label="Remove attached image"
            onClick={() => setFile(null)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground transition-smooth hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {addStatus.isPending && file ? (
        <div data-ocid="status.upload_progress" className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-smooth"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Uploading image… {Math.round(progress)}%
          </p>
        </div>
      ) : null}

      {error ? (
        <p
          data-ocid="status.error_state"
          role="alert"
          className="mt-3 text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-ocid="status.image_input"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              setProgress(0);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            data-ocid="status.upload_button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
          >
            <ImagePlus className="h-4 w-4" />
            Add image
          </button>
          <span
            data-ocid="status.char_counter"
            className={cn(
              "font-mono text-xs",
              overLimit ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
        <button
          type="button"
          data-ocid="status.submit_button"
          onClick={handleSubmit}
          disabled={!canPost}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addStatus.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post
        </button>
      </div>
    </div>
  );
}
