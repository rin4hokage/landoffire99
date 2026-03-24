import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

const Auth = () => {
  const { session, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, Commander.");
      } else {
        if (!username.trim()) {
          toast.error("Username is required.");
          setSubmitting(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-[0.3em] text-foreground mb-2">
            LAND OF FIRE
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            AI Agent Command Center
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="status-dot status-active animate-pulse-status" />
            <span className="text-xs font-mono text-muted-foreground">System Online</span>
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <div className="flex gap-1 p-1 rounded-md bg-muted/20">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-mono rounded transition-colors ${
                isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-mono rounded transition-colors ${
                !isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <Label htmlFor="username" className="text-xs font-mono text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="commander"
                  className="bg-background/50 border-border font-mono text-sm"
                  maxLength={30}
                />
              </motion.div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-mono text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@landoffire.dev"
                required
                className="bg-background/50 border-border font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-mono text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-background/50 border-border font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-mono text-xs tracking-wider"
            >
              {submitting ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : isLogin ? (
                <>
                  <LogIn size={14} />
                  Access Command Center
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs font-mono text-muted-foreground mt-6">
          Secure access only. All activity is logged.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
