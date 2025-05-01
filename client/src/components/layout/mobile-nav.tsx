import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SidebarNav from "./sidebar-nav";

type MobileNavProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
};

export default function MobileNav({ isOpen, onOpenChange, user }: MobileNavProps) {
  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar-background border-b border-sidebar-border z-20 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(!isOpen)}
          className="text-sidebar-foreground"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <h1 className="text-xl font-bold text-primary">LogiCost</h1>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          <User className="h-4 w-4" />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Sidebar */}
        <div className="fixed top-0 left-0 h-full w-64 bg-sidebar-background shadow-lg">
          <div className="p-4 flex justify-between items-center border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-primary">LogiCost</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close Menu</span>
            </Button>
          </div>
          
          <div className="h-[calc(100%-64px)] overflow-y-auto">
            <SidebarNav className="relative h-full border-none" user={user} />
          </div>
        </div>
      </div>
    </>
  );
}
