import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const schema = z.object({
  headline: z.string().trim().min(8, "Tell us what you do (min 8 chars)").max(120),
  category: z.string().min(1, "Pick a category"),
  hourly_rate: z.coerce.number().min(1).max(10000),
  location: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1000).optional(),
});

export default function BecomeProvider() {
  const { user, isProvider, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    headline: "",
    category: "",
    hourly_rate: "",
    location: "",
    bio: "",
  });

  useEffect(() => { document.title = "Become a provider — ServiceLocal"; }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?mode=signup");
    if (!loading && isProvider) navigate("/provider");
  }, [user, isProvider, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSubmitting(true);
    try {
      // Update bio on profile
      if (parsed.data.bio) {
        await supabase.from("profiles").update({ bio: parsed.data.bio, location: parsed.data.location }).eq("id", user.id);
      }
      // Create provider record (status=pending)
      const { error } = await supabase.from("providers").insert({
        user_id: user.id,
        headline: parsed.data.headline,
        category: parsed.data.category,
        hourly_rate: parsed.data.hourly_rate,
        location: parsed.data.location,
      });
      if (error) throw error;
      // Add provider role
      await supabase.from("user_roles").insert({ user_id: user.id, role: "provider" });
      toast.success("Provider profile submitted! Awaiting admin approval.");
      navigate("/provider");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12 max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-soft mb-4">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Become a provider</h1>
          <p className="text-muted-foreground mt-3">
            Tell us about yourself. Your profile will be reviewed before going live.
          </p>
        </div>
        <Card className="p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Math & physics tutor for high schoolers" required maxLength={120} />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tutoring">Tutoring</SelectItem>
                    <SelectItem value="Pet care">Pet care</SelectItem>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                    <SelectItem value="Home help">Home help</SelectItem>
                    <SelectItem value="Creative">Creative</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hourly rate ($)</Label>
                <Input type="number" min={1} value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Brooklyn, NY" required maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>About you</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short bio. What makes you great at this?" rows={5} maxLength={1000} />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for review"}
            </Button>
          </form>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
