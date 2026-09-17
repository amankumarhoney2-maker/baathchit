import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAddReel } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clapperboard, Film, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

const ACCEPTED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
];

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || ACCEPTED_TYPES.includes(file.type);
}

export function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReel = useAddReel();
  const isUploading = addReel.isPending;

  const selectFile = (candidate: File | undefined | null) => {
    setError(null);
    if (!candidate) return;
    if (!isVideoFile(candidate)) {
      setError("Please choose a video file (MP4, WebM, MOV, or OGG).");
      return;
    }
    setFile(candidate);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    if (!file || !caption.trim() || isUploading) return;
    const trimmed = caption.trim();
    setProgress(0);
    addReel.mutate(
      { caption: trimmed, file, onProgress: setProgress },
      {
        onSuccess: () => {
          void navigate({ to: "/reels" });
        },
        onError: () => {
          setError(
            "Upload failed. Please check your connection and try again.",
          );
        },
      },
    );
  };

  const canSubmit = !!file && caption.trim().length > 0 && !isUploading;

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
          <Clapperboard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            New Reel
          </h1>
          <p className="text-sm text-muted-foreground">
            Share a video with the community
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        data-ocid="upload.input"
        onChange={(e) => selectFile(e.target.files?.[0])}
      />
      <button
        type="button"
        data-ocid="upload.dropzone"
        aria-label="Choose a video to upload"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-smooth",
          dragActive
            ? "border-primary bg-primary/10"
            : "border-border bg-card hover:border-primary/50 hover:bg-card/70",
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-elevated">
          <UploadCloud className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold">
            {file ? file.name : "Drag & drop your video"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : "or tap to browse — MP4, WebM, MOV, OGG"}
          </p>
        </div>
      </button>

      {file && (
        <div
          data-ocid="upload.selected_file"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
            <Film className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove selected video"
            data-ocid="upload.remove_button"
            disabled={isUploading}
            onClick={() => {
              setFile(null);
              setProgress(0);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="reel-caption"
          className="text-sm font-medium text-foreground"
        >
          Caption
        </label>
        <Textarea
          id="reel-caption"
          data-ocid="upload.caption_input"
          placeholder="Write a caption for your reel…"
          value={caption}
          maxLength={220}
          disabled={isUploading}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-24 resize-none"
        />
        <p className="text-right text-xs text-muted-foreground">
          {caption.length}/220
        </p>
      </div>

      {isUploading && (
        <div
          data-ocid="upload.loading_state"
          className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Uploading video…</span>
            <span className="text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} data-ocid="upload.progress" />
        </div>
      )}

      {error && (
        <p
          data-ocid="upload.error_state"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {addReel.isSuccess && (
        <div
          data-ocid="upload.success_state"
          className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <CheckCircle2 className="h-5 w-5" />
          Reel published! Taking you to your feed…
        </div>
      )}

      <Button
        type="button"
        size="lg"
        data-ocid="upload.submit_button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full rounded-full bg-gradient-primary text-primary-foreground shadow-elevated"
      >
        {isUploading ? "Uploading…" : "Publish Reel"}
      </Button>
    </div>
  );
}
