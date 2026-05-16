import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-24">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">ServiceLocal</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            A warmer way to book the people who help you live well.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold mb-3">Customers</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/browse" className="hover:text-primary transition-smooth">Browse services</Link></li>
            <li><Link to="/auth" className="hover:text-primary transition-smooth">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold mb-3">Providers</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/become-provider" className="hover:text-primary transition-smooth">List your service</Link></li>
            <li><Link to="/provider" className="hover:text-primary transition-smooth">Provider dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold mb-3">Company</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>About</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ServiceLocal. Made with care.
      </div>
    </footer>
  );
}
