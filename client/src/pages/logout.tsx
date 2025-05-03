import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };

    performLogout();
  }, [logout]);

  return (
    <div className="flex items-center justify-center min-h-screen flex-col">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-lg">Đang đăng xuất...</p>
      <Redirect to="/login" />
    </div>
  );
}
