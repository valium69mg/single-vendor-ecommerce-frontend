let isLoggingOut = false;

export function handleUnauthorized(logout: () => void) {
  if (isLoggingOut) return;

  isLoggingOut = true;

  setTimeout(() => {
    logout();
    isLoggingOut = false;
  }, 0);
}