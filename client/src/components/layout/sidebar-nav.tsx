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
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm font-medium",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        {icon}
        <span className="ml-3">{label}</span>
      </a>
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
          Main
        </div>
        <nav className="space-y-1">
          <NavItem 
            href="/" 
            icon={<LayoutDashboard className="h-5 w-5" />} 
            label="Dashboard" 
            active={isActive("/")}
          />
          <NavItem 
            href="/bills" 
            icon={<FileText className="h-5 w-5" />} 
            label="Bills" 
            active={isActive("/bills")}
          />
          <NavItem 
            href="/reports" 
            icon={<BarChart3 className="h-5 w-5" />} 
            label="Reports" 
            active={isActive("/reports")}
          />
          <NavItem 
            href="/settings" 
            icon={<Settings className="h-5 w-5" />} 
            label="Settings" 
            active={isActive("/settings")}
          />
        </nav>
        
        <div className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mt-6 mb-2">
          Management
        </div>
        <nav className="space-y-1">
          <NavItem 
            href="/customers" 
            icon={<Users className="h-5 w-5" />} 
            label="Customers" 
            active={isActive("/customers")}
          />
          <NavItem 
            href="/suppliers" 
            icon={<Store className="h-5 w-5" />} 
            label="Suppliers" 
            active={isActive("/suppliers")}
          />
          <NavItem 
            href="/pricing" 
            icon={<DollarSign className="h-5 w-5" />} 
            label="Pricing" 
            active={isActive("/pricing")}
          />
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full border-t border-sidebar-border p-4">
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
      </div>
    </aside>
  );
}
