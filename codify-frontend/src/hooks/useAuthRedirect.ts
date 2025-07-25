import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Hook to redirect authenticated users away from auth pages
 * @param redirectTo - Optional custom redirect path
 */


export function useAuthRedirect(redirectTo?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        // Default redirect logic based on user role
        if (session.user?.role === 'TEACHER') {
          router.replace('/dashboard?isteacher=true'); // passing a param just in case
        } else {
          router.replace('/dashboard?isteacher=false');
        }
      }
    }
  }, [status, session, router, redirectTo]);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session
  };
}
