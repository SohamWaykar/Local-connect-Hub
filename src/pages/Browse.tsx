import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star, MapPin, BadgeCheck, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ProviderRow {
  id: string;
  user_id: string;
  headline: string;
  category: string;
  hourly_rate: number | null;
  location: string;
  verified: boolean;
  avg_rating: number;
  total_reviews: number;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

const PAGE_SIZE = 9;

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "all";
  const sort = params.get("sort") ?? "rating-desc";
  const maxPrice = params.get("maxPrice") ?? "";

  useEffect(() => {
    document.title = "Browse local services — ServiceLocal";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase
        .from("providers")
        .select("*, profiles!providers_profile_fk(full_name, avatar_url)", { count: "exact" })
        .eq("status", "approved");

      if (search) query = query.or(`headline.ilike.%${search}%,location.ilike.%${search}%`);
      if (category !== "all") query = query.eq("category", category);
      if (maxPrice) query = query.lte("hourly_rate", Number(maxPrice));

      const [col, dir] = sort.split("-");
      query = query.order(col, { ascending: dir === "asc" });

      const from = (page - 1) * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (!error) {
        setProviders((data ?? []) as any);
        setTotal(count ?? 0);
      }
      setLoading(false);
    };
    fetchData();
  }, [search, category, sort, maxPrice, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value); else next.delete(key);
    setParams(next);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Find your local pro
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            {total} verified provider{total === 1 ? "" : "s"} ready to help.
          </p>
        </div>

        {/* Filters */}
        <Card className="p-5 mb-8 grid gap-4 md:grid-cols-5 items-end shadow-soft">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
            <Input
              placeholder="Search by skill or location..."
              defaultValue={search}
              onChange={(e) => updateParam("q", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
            <Select value={category} onValueChange={(v) => updateParam("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max price/hr</label>
            <Input
              type="number"
              placeholder="Any"
              defaultValue={maxPrice}
              onChange={(e) => updateParam("maxPrice", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort</label>
            <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="avg_rating-desc">Rating ↓</SelectItem>
                <SelectItem value="hourly_rate-asc">Price ↑</SelectItem>
                <SelectItem value="hourly_rate-desc">Price ↓</SelectItem>
                <SelectItem value="total_reviews-desc">Most reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <Card className="p-12 text-center">
            <Filter className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-display text-xl mb-1">No providers found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your filters.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Link key={p.id} to={`/providers/${p.id}`}>
                <Card className="group p-6 h-full shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display text-lg font-semibold">
                      {(p.profiles?.full_name ?? "P").charAt(0).toUpperCase()}
                    </div>
                    {p.verified && (
                      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">
                        <BadgeCheck className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-semibold leading-tight group-hover:text-primary transition-smooth">
                    {p.profiles?.full_name ?? "Provider"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.headline}</p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <strong className="text-foreground">{p.avg_rating.toFixed(1)}</strong>
                      <span>({p.total_reviews})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {p.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
                    <Badge variant="secondary" className="bg-accent-soft text-accent border-0">
                      {p.category}
                    </Badge>
                    {p.hourly_rate && (
                      <p className="font-display text-lg font-semibold">
                        ${Number(p.hourly_rate).toFixed(0)}<span className="text-xs text-muted-foreground font-sans">/hr</span>
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <div className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</div>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
