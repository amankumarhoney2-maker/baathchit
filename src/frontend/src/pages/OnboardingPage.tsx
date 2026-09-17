import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetCallerProfile,
  useIsUsernameAvailable,
  useRegisterUser,
} from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import {
  AtSign,
  Check,
  Clapperboard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function OnboardingPage() {
  const { isAuthenticated, isInitializing, login, isLoggingIn, isLoginError } =
    useAuth();
  const navigate = useNavigate();

  const profile = useGetCallerProfile();
  const hasProfile = !!profile.data;

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) return;
    if (profile.isLoading) return;
    if (hasProfile) {
      void navigate({ to: "/profile" });
    }
  }, [
    isAuthenticated,
    isInitializing,
    profile.isLoading,
    hasProfile,
    navigate,
  ]);

  const showSignIn = !isAuthenticated;
  const showSetup = isAuthenticated && !profile.isLoading && !hasProfile;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        {showSignIn ? (
          <SignInCard
            isLoggingIn={isLoggingIn}
            isLoginError={isLoginError}
            onLogin={() => login({ provider: "google" })}
          />
        ) : showSetup ? (
          <SetupCard />
        ) : (
          <div
            data-ocid="onboarding.loading_state"
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading your account…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SignInCard({
  isLoggingIn,
  isLoginError,
  onLogin,
}: {
  isLoggingIn: boolean;
  isLoginError: boolean;
  onLogin: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-elevated">
        <Clapperboard className="h-10 w-10 text-primary-foreground" />
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">
        Baathchit
      </h1>
      <p className="mt-3 text-muted-foreground">
        Watch reels, chat privately, and share moments with friends.
      </p>

      <Button
        type="button"
        data-ocid="onboarding.google_button"
        onClick={onLogin}
        disabled={isLoggingIn}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-primary px-6 py-6 text-base font-medium text-primary-foreground shadow-elevated transition-smooth hover:opacity-90 disabled:opacity-60"
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing in…
          </>
        ) : (
          "Continue with Google"
        )}
      </Button>

      {isLoginError && (
        <p
          data-ocid="onboarding.error"
          className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Sign-in failed. Please try again.
        </p>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        By continuing you agree to use your Google account to sign in securely.
      </p>
    </div>
  );
}

function SetupCard() {
  const navigate = useNavigate();
  const register = useRegisterUser();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const trimmedUsername = username.trim();
  const usernameValid = USERNAME_PATTERN.test(trimmedUsername);
  const availability = useIsUsernameAvailable(trimmedUsername);
  const usernameTaken =
    usernameValid && availability.data === false && availability.isSuccess;

  const passwordValid = password.length >= 8;
  const confirmValid = confirm === password && confirm.length > 0;
  const canSubmit =
    usernameValid &&
    !usernameTaken &&
    availability.isSuccess &&
    passwordValid &&
    confirmValid &&
    !register.isPending;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    register.mutate(
      { username: trimmedUsername, password },
      {
        onSuccess: (ok) => {
          if (ok) {
            void navigate({ to: "/profile" });
          } else {
            void availability.refetch();
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-elevated">
        <Clapperboard className="h-10 w-10 text-primary-foreground" />
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Create your profile
      </h1>
      <p className="mt-2 text-muted-foreground">
        Pick a unique username and a password saved to your Google account.
      </p>

      <form
        className="mt-8 flex w-full flex-col gap-5 text-left"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-username">Username</Label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="onboarding-username"
              data-ocid="onboarding.username_input"
              value={username}
              maxLength={20}
              autoComplete="username"
              placeholder="e.g. aarav_sharma"
              className="h-12 rounded-2xl border-input bg-card pl-10"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {touched && username.length > 0 && !usernameValid && (
            <p
              data-ocid="onboarding.username_error"
              className="text-xs text-destructive"
            >
              3–20 characters, lowercase letters, numbers, or underscores.
            </p>
          )}
          {usernameValid && availability.isLoading && (
            <p className="text-xs text-muted-foreground">
              Checking availability…
            </p>
          )}
          {usernameValid && availability.isSuccess && !usernameTaken && (
            <p
              data-ocid="onboarding.username_available"
              className="flex items-center gap-1 text-xs text-success"
            >
              <Check className="h-3.5 w-3.5" /> {trimmedUsername} is available
            </p>
          )}
          {usernameTaken && (
            <p
              data-ocid="onboarding.username_taken"
              className="text-xs text-destructive"
            >
              That username is already taken.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="onboarding-password"
              data-ocid="onboarding.password_input"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="h-12 rounded-2xl border-input bg-card pl-10 pr-11"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              data-ocid="onboarding.toggle_password"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-smooth hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {touched && password.length > 0 && !passwordValid && (
            <p
              data-ocid="onboarding.password_error"
              className="text-xs text-destructive"
            >
              Password must be at least 8 characters.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="onboarding-confirm"
              data-ocid="onboarding.confirm_input"
              type={showPassword ? "text" : "password"}
              value={confirm}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="h-12 rounded-2xl border-input bg-card pl-10"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {touched && confirm.length > 0 && !confirmValid && (
            <p
              data-ocid="onboarding.confirm_error"
              className="text-xs text-destructive"
            >
              Passwords do not match.
            </p>
          )}
        </div>

        {register.isError && (
          <p
            data-ocid="onboarding.register_error"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Could not save your profile. Please try again.
          </p>
        )}

        <Button
          type="submit"
          data-ocid="onboarding.submit_button"
          disabled={!canSubmit}
          className="mt-2 h-12 w-full rounded-full bg-gradient-primary text-base font-medium text-primary-foreground shadow-elevated transition-smooth hover:opacity-90 disabled:opacity-60"
        >
          {register.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </div>
  );
}
