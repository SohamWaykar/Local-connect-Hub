import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Search, ShieldCheck, Star, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroImage from "@/assets/hero-illustration.jpg";

const categories = [
  { name: "Tutoring", icon: "📚", count: "2,400+" },
  { name: "Pet care", icon: "🐕", count: "1,100+" },
  { name: "Wellness", icon: "🧘", count: "890+" },
  { name: "Home help", icon: "🛠️", count: "1,800+" },
  { name: "Creative", icon: "🎨", count: "650+" },
  { name: "Tech", icon: "💻", count: "1,200+" },
];

const features = [
  {
    icon: Search,
    title: "Find the right person",
    body: "Search by skill, price or rating. Filter to your neighborhood. No endless scrolling.",
  },
  {
    icon: Calendar,
    title: "Book in seconds",
    body: "Pick a slot from a real-time calendar. No back-and-forth, no double bookings.",
  },
  {
    icon: ShieldCheck,
    title: "Verified providers",
    body: "Every provider is reviewed by our team. Look for the verified badge.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 -left-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        </div>
        <div className="container relative grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-28">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-4 py-1.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              A new kind of services marketplace
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] text-foreground">
              Help is just <em className="text-accent not-italic">around</em><br/>the corner.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Book trusted local pros — tutors, dog walkers, handymen, healers — with real-time
              availability and a single, friendly platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/browse">
                  Find a service <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/become-provider">Offer your skills</Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span><strong className="text-foreground">4.9</strong> avg rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-accent" />
                <span><strong className="text-foreground">12k+</strong> bookings</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-elegant animate-float">
              <img
                src={heroImage}
                alt="Local service providers ready to help — tutor, dog walker, handyman, yoga instructor"
                width={1536}
                height={1152}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden md:flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-elegant border border-border">
              <div className="h-10 w-10 rounded-xl bg-success/15 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking confirmed</p>
                <p className="text-sm font-semibold">Tomorrow, 3:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Whatever you need, there's someone nearby.
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={`/browse?category=${encodeURIComponent(c.name)}`}
              className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth"
            >
              <div className="text-3xl mb-3">{c.icon}</div>
              <p className="font-semibold text-sm group-hover:text-primary transition-smooth">{c.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.count} pros</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/40 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
              Built for warm, human transactions.
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              No noise, no spam, no fake reviews. Just a clean way to find and book the help you need.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-3xl bg-card p-8 shadow-soft border border-border">
                <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-5 shadow-soft">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 md:p-20 text-center shadow-elegant">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative max-w-2xl mx-auto space-y-6 text-primary-foreground">
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              Earn doing what you love.
            </h2>
            <p className="text-lg opacity-90">
              Set your hours, set your prices, keep your craft yours. Join thousands of providers on ServiceLocal.
            </p>
            <Button asChild variant="hero" size="xl">
              <Link to="/become-provider">Become a provider <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
