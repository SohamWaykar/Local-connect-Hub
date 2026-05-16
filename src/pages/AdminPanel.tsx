import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, BadgeCheck } from "lucide-react";

export default function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { document.title = "Admin — ServiceLocal"; }, []);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    const { data } = await supabase
      .from("providers")
      .select("*, profiles!providers_profile_fk(full_name)")
      .order("created_at", { ascending: false });
    setProviders(data ?? []);
    setBusy(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const updateStatus = async (id: string, status: string, verified = false) => {
    const patch: any = { status };
    if (verified) patch.verified = true;
    const { error } = await supabase.from("providers").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Admin panel</h1>
            <p className="text-muted-foreground">Approve, verify and manage providers.</p>
          </div>
        </div>

        {busy ? <p>Loading...</p> : (
          <div className="grid gap-3">
            {providers.map((p) => (
              <Card key={p.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{p.profiles?.full_name}</p>
                    <Badge variant="outline">{p.status}</Badge>
                    {p.verified && <Badge className="bg-success/15 text-success border-success/30"><BadgeCheck className="h-3 w-3 mr-1" />Verified</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{p.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.category} • {p.location} • ${p.hourly_rate}/hr</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.status !== "approved" && <Button size="sm" variant="default" onClick={() => updateStatus(p.id, "approved")}>Approve</Button>}
                  {p.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "rejected")}>Reject</Button>}
                  {!p.verified && p.status === "approved" && <Button size="sm" variant="accent" onClick={() => updateStatus(p.id, "approved", true)}>Verify</Button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
