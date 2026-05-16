import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SiteHeader() {
  const { user, isProvider, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const initial = (user?.email?.[0] ?? "U").toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft transition-smooth group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            ServiceLocal
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <NavLink to="/browse" className={({ isActive }) =>
            `transition-smooth hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`
          }>
            Browse services
          </NavLink>
          <NavLink to="/become-provider" className={({ isActive }) =>
            `transition-smooth hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`
          }>
            Become a provider
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 pl-2 pr-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Customer dashboard
                </DropdownMenuItem>
                {isProvider && (
                  <DropdownMenuItem onClick={() => navigate("/provider")}>
                    <Sparkles className="mr-2 h-4 w-4" /> Provider dashboard
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>Sign in</Button>
              <Button variant="hero" onClick={() => navigate("/auth?mode=signup")}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
