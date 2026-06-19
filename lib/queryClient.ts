import { QueryClient } from '@tanstack/react-query';

/** Cache serveur (TanStack Query) — distinct de l'état local (Zustand). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
