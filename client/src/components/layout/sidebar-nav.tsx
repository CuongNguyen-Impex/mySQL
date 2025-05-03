import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { 
  BarChart3, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  Users, 
  Store, 
  DollarSign, 
  Sun, 
  Moon,
  User
} from "lucide-react";

type SidebarNavProps = {
  className?: string;
  user?: any;
};

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </Link>
  );
}

export default function SidebarNav({ className, user }: SidebarNavProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className={cn(
      "bg-sidebar-background border-r border-sidebar-border shadow-sm",
      className
    )}>
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-primary">LogiCost</h1>
        <div className="inline-flex items-center">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-2">
          Danh mục chính
        </div>
        <nav className="space-y-1">
          <NavItem 
            href="/" 
            icon={<LayoutDashboard className="h-5 w-5" />} 
            label="Tổng quan" 
            active={isActive("/")}
          />
          <NavItem 
            href="/bills" 
            icon={<FileText className="h-5 w-5" />} 
            label="Hóa đơn" 
            active={isActive("/bills")}
          />
          <NavItem 
            href="/reports" 
            icon={<BarChart3 className="h-5 w-5" />} 
            label="Báo cáo" 
            active={isActive("/reports")}
          />
          <NavItem 
            href="/settings" 
            icon={<Settings className="h-5 w-5" />} 
            label="Cài đặt" 
            active={isActive("/settings")}
          />
        </nav>
        
        <div className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mt-6 mb-2">
          Quản lý
        </div>
        <nav className="space-y-1">
          <NavItem 
            href="/customers" 
            icon={<Users className="h-5 w-5" />} 
            label="Khách hàng" 
            active={isActive("/customers")}
          />
          <NavItem 
            href="/suppliers" 
            icon={<Store className="h-5 w-5" />} 
            label="Nhà cung cấp" 
            active={isActive("/suppliers")}
          />
          <NavItem 
            href="/pricing" 
            icon={<DollarSign className="h-5 w-5" />} 
            label="Bảng giá" 
            active={isActive("/pricing")}
          />
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {user?.username || "Guest User"}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {user?.role === "admin" ? "Administrator" : "Regular User"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = "/logout"}
            className="p-2 rounded-md text-red-500 hover:bg-sidebar-accent/50"
            title="Đăng xuất"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
