import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  useChangePassword,
  useChangeUsername,
  useGetCallerProfile,
  useIsUsernameAvailable,
  useSetProfilePicture,
  useSetVisibility,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") || ACCEPTED_IMAGE_TYPES.includes(file.type)
  );
}

export function SettingsPage() {
  const { identity } = useAuth();
  const { data: profile, isLoading } = useGetCallerProfile();

  const pictureInputRef = useRef<HTMLInputElement>(null);
  const [pictureProgress, setPictureProgress] = useState(0);
  const [pictureError, setPictureError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const changePassword = useChangePassword();
  const changeUsername = useChangeUsername();
  const setProfilePicture = useSetProfilePicture();
  const setVisibility = useSetVisibility();

  const principalHandle = useMemo(() => {
    const principal = identity?.getPrincipal().toText() ?? "";
    return principal ? `@${principal.slice(0, 8)}` : "@you";
  }, [identity]);

  const displayHandle = useMemo(
    () => (profile?.username ? `@${profile.username}` : principalHandle),
    [profile, principalHandle],
  );

  const initial = (displayHandle[1] ?? "B").toUpperCase();
  const pictureUrl = profile?.profilePicture?.getDirectURL();
  const isPublic = profile?.isPublic ?? true;

  const trimmedUsername = username.trim();
  const usernameDirty = trimmedUsername.length > 0;
  const { data: usernameAvailable } = useIsUsernameAvailable(trimmedUsername);
  const usernameChanged = trimmedUsername !== (profile?.username ?? "");
  const usernameValid =
    usernameDirty &&
    usernameChanged &&
    usernameAvailable === true &&
    /^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername);

  const passwordValid =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handlePictureSelect = (candidate: File | undefined | null) => {
    setPictureError(null);
    if (!candidate) return;
    if (!isImageFile(candidate)) {
      setPictureError("Please choose an image file (JPG, PNG, WebP, or GIF).");
      return;
    }
    setPictureProgress(0);
    setProfilePicture.mutate(
      { file: candidate, onProgress: setPictureProgress },
      {
        onError: () => {
          setPictureError(
            "Upload failed. Please check your connection and try again.",
          );
        },
      },
    );
  };

  const handleUsernameSubmit = () => {
    if (!usernameValid || changeUsername.isPending) return;
    setUsernameError(null);
    changeUsername.mutate(trimmedUsername, {
      onSuccess: (ok) => {
        if (ok) {
          setUsername("");
        } else {
          setUsernameError("That username is already taken. Try another one.");
        }
      },
      onError: () => {
        setUsernameError("Could not update your username. Please try again.");
      },
    });
  };

  const handlePasswordSubmit = () => {
    if (!passwordValid || changePassword.isPending) return;
    setPasswordError(null);
    setPasswordSuccess(false);
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: (ok) => {
          if (ok) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordSuccess(true);
          } else {
            setPasswordError(
              "Your current password is incorrect. Please try again.",
            );
          }
        },
        onError: () => {
          setPasswordError("Could not change your password. Please try again.");
        },
      },
    );
  };

  const handleVisibilityChange = (next: boolean) => {
    if (next === isPublic || setVisibility.isPending) return;
    setVisibility.mutate(next);
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          data-ocid="settings.back_link"
          aria-label="Back to profile"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground">
          Settings
        </h1>
      </div>

      {/* Account summary */}
      <section
        data-ocid="settings.account_section"
        aria-label="Account"
        className="mt-6 rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {pictureUrl ? (
              <img
                src={pictureUrl}
                alt="Your profile"
                className="h-16 w-16 rounded-full object-cover shadow-elevated"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary font-display text-2xl font-bold text-white shadow-elevated">
                {initial}
              </div>
            )}
            <button
              type="button"
              data-ocid="settings.picture_button"
              aria-label="Change profile picture"
              onClick={() => pictureInputRef.current?.click()}
              disabled={setProfilePicture.isPending}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-subtle transition-smooth hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profile picture
            </p>
            <p className="mt-0.5 truncate font-display text-lg font-bold text-foreground">
              {isLoading ? "…" : displayHandle}
            </p>
          </div>
        </div>

        <input
          ref={pictureInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          data-ocid="settings.picture_input"
          onChange={(e) => handlePictureSelect(e.target.files?.[0])}
        />

        {setProfilePicture.isPending && (
          <div
            data-ocid="settings.picture_loading_state"
            className="mt-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Uploading picture…</span>
              <span className="text-muted-foreground">
                {Math.round(pictureProgress)}%
              </span>
            </div>
            <Progress
              value={pictureProgress}
              data-ocid="settings.picture_progress"
            />
          </div>
        )}

        {setProfilePicture.isSuccess && !setProfilePicture.isPending && (
          <p
            data-ocid="settings.picture_success_state"
            className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          >
            <CheckCircle2 className="h-4 w-4" />
            Profile picture updated.
          </p>
        )}

        {pictureError && (
          <p
            data-ocid="settings.picture_error_state"
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {pictureError}
          </p>
        )}

        <dl className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4" />
              Username
            </dt>
            <dd
              data-ocid="settings.username"
              className="truncate text-sm font-semibold text-foreground"
            >
              {isLoading ? "…" : displayHandle}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              Account visibility
            </dt>
            <dd
              data-ocid="settings.visibility"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                isPublic
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isPublic ? "bg-primary" : "bg-muted-foreground",
                )}
              />
              {isPublic ? "Public" : "Private"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Visibility toggle */}
      <section
        data-ocid="settings.visibility_section"
        aria-label="Account visibility"
        className="mt-4 rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Private account
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              When private, other users can't see your ID anywhere in the app.
              Your own ID stays visible to you.
            </p>
          </div>
          <Switch
            data-ocid="settings.visibility_toggle"
            checked={!isPublic}
            disabled={setVisibility.isPending}
            onCheckedChange={(checked) => handleVisibilityChange(!checked)}
            aria-label="Toggle private account"
          />
        </div>
        {setVisibility.isPending && (
          <p
            data-ocid="settings.visibility_loading_state"
            className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating visibility…
          </p>
        )}
      </section>

      {/* Username */}
      <section
        data-ocid="settings.username_section"
        aria-label="Change username"
        className="mt-4 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <UserRound className="h-4 w-4 text-primary" />
          Change username
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a unique handle — 3–20 letters, numbers, or underscores.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              data-ocid="settings.username_input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(null);
              }}
              placeholder={profile?.username ?? "New username"}
              maxLength={20}
              disabled={changeUsername.isPending}
              aria-label="New username"
              className="flex-1"
            />
            <Button
              type="button"
              data-ocid="settings.username_submit_button"
              disabled={!usernameValid || changeUsername.isPending}
              onClick={handleUsernameSubmit}
            >
              {changeUsername.isPending ? "Saving…" : "Save"}
            </Button>
          </div>

          {usernameDirty && usernameChanged && usernameAvailable === false && (
            <p
              data-ocid="settings.username_unavailable"
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <XCircle className="h-4 w-4" />
              That username is already taken.
            </p>
          )}
          {usernameDirty &&
            usernameChanged &&
            usernameAvailable === true &&
            !/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername) && (
              <p
                data-ocid="settings.username_invalid"
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <XCircle className="h-4 w-4" />
                Use 3–20 letters, numbers, or underscores.
              </p>
            )}
          {usernameError && (
            <p
              data-ocid="settings.username_error_state"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {usernameError}
            </p>
          )}
          {changeUsername.isSuccess && !usernameError && (
            <p
              data-ocid="settings.username_success_state"
              className="flex items-center gap-2 text-sm text-success"
            >
              <CheckCircle2 className="h-4 w-4" />
              Username updated.
            </p>
          )}
        </div>
      </section>

      {/* Password */}
      <section
        data-ocid="settings.password_section"
        aria-label="Change password"
        className="mt-4 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <KeyRound className="h-4 w-4 text-primary" />
          Change password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your current password, then choose a new one (at least 6
          characters).
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="settings-current-password"
              className="text-sm font-medium text-foreground"
            >
              Current password
            </label>
            <Input
              id="settings-current-password"
              data-ocid="settings.current_password_input"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              disabled={changePassword.isPending}
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="settings-new-password"
              className="text-sm font-medium text-foreground"
            >
              New password
            </label>
            <Input
              id="settings-new-password"
              data-ocid="settings.new_password_input"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              disabled={changePassword.isPending}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="settings-confirm-password"
              className="text-sm font-medium text-foreground"
            >
              Confirm new password
            </label>
            <Input
              id="settings-confirm-password"
              data-ocid="settings.confirm_password_input"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              disabled={changePassword.isPending}
              autoComplete="new-password"
            />
          </div>

          {newPassword.length > 0 && newPassword.length < 6 && (
            <p
              data-ocid="settings.password_too_short"
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <XCircle className="h-4 w-4" />
              Password must be at least 6 characters.
            </p>
          )}
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p
              data-ocid="settings.password_mismatch"
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <XCircle className="h-4 w-4" />
              Passwords don't match.
            </p>
          )}
          {passwordError && (
            <p
              data-ocid="settings.password_error_state"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p
              data-ocid="settings.password_success_state"
              className="flex items-center gap-2 text-sm text-success"
            >
              <CheckCircle2 className="h-4 w-4" />
              Password updated.
            </p>
          )}

          <Button
            type="button"
            data-ocid="settings.password_submit_button"
            disabled={!passwordValid || changePassword.isPending}
            onClick={handlePasswordSubmit}
            className="mt-1 w-full rounded-full"
          >
            {changePassword.isPending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </section>

      <p className="mt-4 flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Sign-in is handled through your Google account via Internet Identity.
        Your username and password are saved against that account.
      </p>
    </div>
  );
}
