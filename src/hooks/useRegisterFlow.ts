import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "@/api/api";
import { useUser } from "@/hooks/useUser";

interface UseRegisterFlowOptions {
  onUnverified: () => void;
}

/**
 * Orchestrates the post-registration handoff: performs a background login
 * with the just-submitted credentials, stores the session, and — mirroring
 * how `LoginForm` never navigates itself — leaves landing navigation to the
 * page's own effect (see `RegisterPage`). Only the unverified branch needs
 * an explicit signal, since that path stays on `/registro` instead.
 */
export function useRegisterFlow({ onUnverified }: UseRegisterFlowOptions) {
  const { setUser } = useUser();

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      loginRequest(data),
    onSuccess: (response) => {
      setUser(response);
      if (!response.isVerified) {
        onUnverified();
      }
    },
  });

  const onRegistered = (email: string, password: string) => {
    mutation.mutate({ email, password });
  };

  return { onRegistered, isLoggingIn: mutation.isPending };
}
