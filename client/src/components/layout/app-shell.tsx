import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import SidebarNav from "./sidebar-nav";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();

  // Close mobile sidebar when navigating to a new page
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);

  // Get authentication state
  const { user, isAuthenticated } = useAuth();

  // Check if we're on the login page
  const isLoginPage = location.startsWith('/login');

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar - only show when authenticated and not on login page */}
      {isAuthenticated && !isLoginPage && (
        <SidebarNav className="w-64 hidden lg:block fixed h-full z-10" user={user} />
      )}
      
      {/* Mobile Navbar - only show when authenticated and not on login page */}
      {isAuthenticated && !isLoginPage && (
        <MobileNav 
          isOpen={isMobileSidebarOpen}
          onOpenChange={setIsMobileSidebarOpen} 
          user={user}
        />
      )}
      
      {/* Main Content */}
      <main className={`flex-1 ${isAuthenticated && !isLoginPage ? 'lg:ml-64 pt-16 lg:pt-0' : ''}`}>
        {children}
      </main>
    </div>
  );
}
