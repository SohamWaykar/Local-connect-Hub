import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const statusStyles: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { document.title = "My bookings — ServiceLocal"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("bookings")
        .select("*, services(title), availability_slots(starts_at, ends_at), providers(headline, profiles!providers_profile_fk(full_name))")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      setBookings(data ?? []);
      setBusy(false);
    };
    if (user) load();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Your bookings</h1>
            <p className="text-muted-foreground mt-2">Track everything you've booked in one place.</p>
          </div>
          <Button asChild variant="hero"><Link to="/browse"><Search className="mr-2 h-4 w-4" />Find more services</Link></Button>
        </div>

        {busy ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-display text-xl">No bookings yet</p>
            <p className="text-muted-foreground text-sm mt-1">Browse services and book your first session.</p>
            <Button asChild variant="hero" className="mt-6"><Link to="/browse">Browse services</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((b) => (
              <Card key={b.id} className="p-6 shadow-soft hover:shadow-elegant transition-smooth">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display text-xl font-semibold">{b.services?.title ?? "Service"}</h3>
                      <Badge variant="outline" className={statusStyles[b.status]}>{b.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      with <strong className="text-foreground">{b.providers?.profiles?.full_name}</strong>
                    </p>
                    {b.availability_slots && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(b.availability_slots.starts_at), "EEE, MMM d • h:mm a")}
                      </p>
                    )}
                  </div>
                  <p className="font-display text-2xl font-semibold">${Number(b.total_price).toFixed(0)}</p>
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
