import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export function useAuth() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
  } = useInternetIdentity();

  return {
    identity,
    login,
    logout: clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
  };
}
