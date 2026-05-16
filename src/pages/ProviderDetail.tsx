import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { Star, MapPin, BadgeCheck, ArrowLeft, Calendar as CalIcon, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: s }, { data: sl }] = await Promise.all([
        supabase.from("providers").select("*, profiles!providers_profile_fk(full_name, avatar_url, bio)").eq("id", id).maybeSingle(),
        supabase.from("services").select("*").eq("provider_id", id).eq("active", true),
        supabase.from("availability_slots").select("*").eq("provider_id", id).eq("is_booked", false).gte("starts_at", new Date().toISOString()).order("starts_at"),
      ]);
      setProvider(p);
      setServices(s ?? []);
      setSlots(sl ?? []);
      if (s && s.length) setSelectedService(s[0].id);
      if (p) document.title = `${p.profiles?.full_name ?? "Provider"} — ServiceLocal`;
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const handleBook = async () => {
    if (!user) { navigate("/auth?mode=signup"); return; }
    if (!selectedService || !selectedSlot) { toast.error("Pick a service and time slot"); return; }
    const service = services.find((s) => s.id === selectedService);
    if (!service) return;
    setBooking(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id,
      provider_id: provider.id,
      service_id: service.id,
      slot_id: selectedSlot,
      total_price: service.price,
      status: "pending",
    });
    setBooking(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking requested! Check your dashboard.");
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="container py-12 space-y-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </main>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="container py-24 text-center">
          <h1 className="font-display text-3xl">Provider not found</h1>
          <Button asChild variant="outline" className="mt-6"><Link to="/browse">Browse providers</Link></Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8">
        <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Back to results
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 shadow-soft">
              <div className="flex flex-wrap items-start gap-6">
                <div className="h-24 w-24 rounded-3xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display text-3xl font-semibold shadow-soft">
                  {(provider.profiles?.full_name ?? "P").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="font-display text-3xl md:text-4xl font-semibold">
                      {provider.profiles?.full_name}
                    </h1>
                    {provider.verified && (
                      <Badge className="bg-success/15 text-success border-success/30">
                        <BadgeCheck className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">{provider.headline}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <strong className="text-foreground">{Number(provider.avg_rating).toFixed(1)}</strong>
                      ({provider.total_reviews} reviews)
                    </span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {provider.location}</span>
                    <Badge variant="secondary" className="bg-accent-soft text-accent border-0">{provider.category}</Badge>
                  </div>
                </div>
              </div>
              {provider.profiles?.bio && (
                <p className="mt-6 text-foreground/80 leading-relaxed">{provider.profiles.bio}</p>
              )}
            </Card>

            {/* Services */}
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">Services offered</h2>
              {services.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">No services listed yet.</Card>
              ) : (
                <div className="grid gap-3">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s.id)}
                      className={`text-left rounded-2xl border p-5 transition-smooth ${
                        selectedService === s.id
                          ? "border-accent bg-accent-soft shadow-soft"
                          : "border-border bg-card hover:border-accent/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{s.title}</p>
                          {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="inline h-3 w-3 mr-1" />{s.duration_minutes} min
                          </p>
                        </div>
                        <p className="font-display text-xl font-semibold whitespace-nowrap">
                          ${Number(s.price).toFixed(0)}
                          <span className="text-xs text-muted-foreground font-sans">/{s.price_type === "hourly" ? "hr" : "fixed"}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking sidebar */}
          <aside className="lg:col-span-1">
            <Card className="p-6 shadow-elegant sticky top-20">
              <h2 className="font-display text-2xl font-semibold mb-1">Book a session</h2>
              <p className="text-sm text-muted-foreground mb-5">Pick an available time slot.</p>
              {slots.length === 0 ? (
                <div className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
                  <CalIcon className="h-6 w-6 mx-auto mb-2" />
                  No available slots right now.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-smooth ${
                        selectedSlot === slot.id
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:border-accent/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {format(new Date(slot.starts_at), "EEE, MMM d")}
                      </p>
                      <p className="text-xs opacity-80">
                        {format(new Date(slot.starts_at), "h:mm a")} – {format(new Date(slot.ends_at), "h:mm a")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant="hero"
                size="lg"
                className="w-full mt-5"
                disabled={!selectedSlot || !selectedService || booking}
                onClick={handleBook}
              >
                {booking ? "Booking..." : user ? "Confirm booking" : "Sign in to book"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Payment processing coming soon. No charge yet.
              </p>
            </Card>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
