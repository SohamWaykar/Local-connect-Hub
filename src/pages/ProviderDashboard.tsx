import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, DollarSign, Plus, Trash2, BadgeCheck, Clock } from "lucide-react";

export default function ProviderDashboard() {
  const { user, isProvider, loading } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  // Forms
  const [newService, setNewService] = useState({ title: "", description: "", category: "", price: "", duration_minutes: "60" });
  const [newSlot, setNewSlot] = useState({ date: "", start: "", end: "" });

  useEffect(() => { document.title = "Provider dashboard — ServiceLocal"; }, []);
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user && !isProvider) navigate("/become-provider");
  }, [user, isProvider, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase.from("providers").select("*").eq("user_id", user.id).maybeSingle();
    setProvider(p);
    if (p) {
      const [{ data: s }, { data: sl }, { data: b }] = await Promise.all([
        supabase.from("services").select("*").eq("provider_id", p.id).order("created_at", { ascending: false }),
        supabase.from("availability_slots").select("*").eq("provider_id", p.id).order("starts_at"),
        supabase.from("bookings").select("*, services(title), availability_slots(starts_at), profiles!bookings_customer_profile_fk(full_name)").eq("provider_id", p.id).order("created_at", { ascending: false }),
      ]);
      setServices(s ?? []); setSlots(sl ?? []); setBookings(b ?? []);
    }
    setBusy(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      title: z.string().trim().min(3).max(120),
      description: z.string().trim().max(500).optional(),
      category: z.string().min(1),
      price: z.coerce.number().min(1).max(10000),
      duration_minutes: z.coerce.number().min(15).max(480),
    });
    const parsed = schema.safeParse(newService);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    const { error } = await supabase.from("services").insert({
      provider_id: provider.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      price: parsed.data.price,
      duration_minutes: parsed.data.duration_minutes,
    });
    if (error) return toast.error(error.message);
    toast.success("Service added");
    setNewService({ title: "", description: "", category: "", price: "", duration_minutes: "60" });
    load();
  };

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.date || !newSlot.start || !newSlot.end) return toast.error("Fill all fields");
    const starts = new Date(`${newSlot.date}T${newSlot.start}`);
    const ends = new Date(`${newSlot.date}T${newSlot.end}`);
    if (ends <= starts) return toast.error("End must be after start");
    const { error } = await supabase.from("availability_slots").insert({
      provider_id: provider.id,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("Slot added");
    setNewSlot({ date: "", start: "", end: "" });
    load();
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    load();
  };
  const deleteService = async (id: string) => {
    await supabase.from("services").update({ active: false }).eq("id", id);
    load();
  };
  const updateBookingStatus = async (id: string, status: "pending" | "confirmed" | "completed" | "cancelled") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}`);
    load();
  };

  if (busy) return <div className="min-h-screen"><SiteHeader /><div className="container py-12">Loading...</div></div>;

  const earnings = bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + Number(b.total_price), 0);
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Provider dashboard</h1>
            <p className="text-muted-foreground mt-2">{provider?.headline}</p>
          </div>
          {provider?.status === "approved" ? (
            <Badge className="bg-success/15 text-success border-success/30"><BadgeCheck className="h-3 w-3 mr-1" />Approved</Badge>
          ) : provider?.status === "pending" ? (
            <Badge className="bg-warning/15 text-warning border-warning/30">Pending review</Badge>
          ) : (
            <Badge variant="destructive">Rejected</Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="p-6"><p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Earnings (completed)</p><p className="font-display text-3xl mt-2 flex items-center gap-1"><DollarSign className="h-6 w-6 text-success" />{earnings.toFixed(0)}</p></Card>
          <Card className="p-6"><p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pending requests</p><p className="font-display text-3xl mt-2">{pendingCount}</p></Card>
          <Card className="p-6"><p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Open slots</p><p className="font-display text-3xl mt-2">{slots.filter(s => !s.is_booked).length}</p></Card>
        </div>

        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-3 mt-6">
            {bookings.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">No bookings yet.</Card>
            ) : bookings.map((b) => (
              <Card key={b.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{b.services?.title}</p>
                  <p className="text-sm text-muted-foreground">{b.profiles?.full_name} • {b.availability_slots && format(new Date(b.availability_slots.starts_at), "MMM d, h:mm a")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{b.status}</Badge>
                  {b.status === "pending" && (
                    <>
                      <Button size="sm" variant="default" onClick={() => updateBookingStatus(b.id, "confirmed")}>Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, "cancelled")}>Decline</Button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <Button size="sm" variant="accent" onClick={() => updateBookingStatus(b.id, "completed")}>Mark complete</Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="services" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5" />Add a service</h3>
              <form onSubmit={addService} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><Label>Title</Label><Input value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} required /></div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} rows={2} /></div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={newService.category} onValueChange={(v) => setNewService({ ...newService, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Tutoring","Pet care","Wellness","Home help","Creative","Tech"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Price ($)</Label><Input type="number" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={newService.duration_minutes} onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })} required /></div>
                <div className="md:col-span-2"><Button type="submit" variant="hero">Add service</Button></div>
              </form>
            </Card>
            <div className="grid gap-3">
              {services.filter(s => s.active).map(s => (
                <Card key={s.id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">${s.price} • {s.duration_minutes} min • {s.category}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteService(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="h-5 w-5" />Add availability</h3>
              <form onSubmit={addSlot} className="grid gap-4 md:grid-cols-4 items-end">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={newSlot.date} onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Start</Label><Input type="time" value={newSlot.start} onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })} required /></div>
                <div className="space-y-2"><Label>End</Label><Input type="time" value={newSlot.end} onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })} required /></div>
                <Button type="submit" variant="hero">Add slot</Button>
              </form>
            </Card>
            <div className="grid gap-2">
              {slots.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No slots yet.</Card> :
                slots.map(s => (
                  <Card key={s.id} className="p-4 flex items-center justify-between">
                    <p className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{format(new Date(s.starts_at), "EEE, MMM d • h:mm a")} — {format(new Date(s.ends_at), "h:mm a")}</p>
                    <div className="flex items-center gap-2">
                      {s.is_booked ? <Badge variant="secondary">Booked</Badge> : <Badge variant="outline">Open</Badge>}
                      {!s.is_booked && <Button size="icon" variant="ghost" onClick={() => deleteSlot(s.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </Card>
                ))
              }
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
