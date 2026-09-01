let isLoggingOut = false;

export function handleUnauthorized(logout: () => void) {
  if (isLoggingOut) return;

  isLoggingOut = true;

  setTimeout(() => {
    try {
      logout();
    } finally {
      isLoggingOut = false;
    }
  }, 0);
}
