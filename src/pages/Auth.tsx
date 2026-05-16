import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(128),
});
const signinSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1, "Required").max(128),
});

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // SEO
  useEffect(() => {
    document.title = mode === "signup" ? "Sign up — ServiceLocal" : "Sign in — ServiceLocal";
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ fullName, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created! Welcome.");
      } else {
        const parsed = signinSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <div className="container py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 shadow-elegant border-border/60">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-semibold text-center mb-2">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-center text-muted-foreground text-sm mb-6">
            {mode === "signup" ? "Start booking or offering services in minutes." : "Sign in to your ServiceLocal account."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "signup" ? "Already have an account? " : "New to ServiceLocal? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-accent font-semibold hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
