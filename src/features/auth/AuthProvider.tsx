import { Outlet, useLocation } from "react-router-dom";
import { useBootstrapAuth } from "./useBootstrapAuth";
import { useAuthStore } from "./store";
import { Loader2, ShieldCheck } from "lucide-react";

const AuthProvider = () => {
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  useBootstrapAuth();

  // Public customer routes and auth routes display immediately without delay
  const isPublicRoute =
    location.pathname === "/" ||
    location.pathname === "/services" ||
    location.pathname === "/categories" ||
    location.pathname === "/contact" ||
    location.pathname === "/login" ||
    location.pathname.startsWith("/register");

  if (!isBootstrapped && !user && !isPublicRoute) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground transition-colors">
        <div className="flex flex-col items-center gap-5 p-8 text-center max-w-sm animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm animate-pulse">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              FairGig
            </h2>
            <p className="text-xs text-muted-foreground animate-pulse font-medium">
              Connecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AuthProvider;