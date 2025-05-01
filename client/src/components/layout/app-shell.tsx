import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import SidebarNav from "./sidebar-nav";
import MobileNav from "./mobile-nav";
import { useQuery } from "@tanstack/react-query";
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

  // Check login status
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    onError: () => {
      toast({
        title: "Not logged in",
        description: "Currently using anonymous access - limited functionality available.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <SidebarNav className="w-64 hidden lg:block fixed h-full z-10" user={user} />
      
      {/* Mobile Navbar */}
      <MobileNav 
        isOpen={isMobileSidebarOpen}
        onOpenChange={setIsMobileSidebarOpen} 
        user={user}
      />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
