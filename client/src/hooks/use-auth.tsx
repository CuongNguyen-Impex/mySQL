import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: number;
  username: string;
  role: string;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        if (response.status === 401) {
          return null;
        }
        const userData = await response.json();
        return userData as User;
      } catch (error) {
        return null;
      }
    },
  });

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await response.json();
      return data.user;
    },
  });

  const login = async (credentials: LoginCredentials) => {
    try {
      await loginMutation.mutateAsync(credentials);
      await refetch();
      toast({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng trở lại!',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Đăng nhập thất bại',
        description: error.message || 'Tên đăng nhập hoặc mật khẩu không chính xác',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsAuthenticated(false);
      toast({
        title: 'Đã đăng xuất',
        description: 'Bạn đã đăng xuất khỏi hệ thống',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: 'Lỗi đăng xuất',
        description: error.message || 'Có lỗi khi đăng xuất',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
