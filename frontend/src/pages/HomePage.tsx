import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { productApi, categoryApi, type ApiProduct, type ApiCategory } from "@/lib/api";
import { ArrowRight, Sparkles, Star, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import heroBanner from "@/assets/hero-banner.jpg";

const testimonials = [
  { name: "Priya S.", text: "IRA's AI stylist recommended the perfect outfit for my interview. Landed the job!", rating: 5 },
  { name: "Arjun M.", text: "The quality is unmatched. Every piece feels premium without breaking the bank.", rating: 5 },
  { name: "Sarah L.", text: "Love the minimalist aesthetic. My entire wardrobe is now IRA.", rating: 4 },
];

const toCardProduct = (p: ApiProduct) => ({
  id: String(p.id),
  name: p.name,
  price: p.price,
  originalPrice: p.original_price ?? undefined,
  image: p.image_url,
  images: p.images,
  category: (p.category_name?.toLowerCase() || "men") as any,
  sizes: p.sizes,
  colors: p.colors,
  description: p.description,
  rating: p.rating,
  reviews: p.reviews,
  tags: p.tags,
});

const HomePage = () => {
  const [moodInput, setMoodInput] = useState("");
  const [email, setEmail] = useState("");
  const [trending, setTrending] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    productApi.list().then((p) => setTrending(p.slice(0, 4))).catch(console.error);
    categoryApi.list().then(setCategories).catch(console.error);
  }, []);

  const handleAIStylistSubmit = () => {
    if (!moodInput.trim()) return;
    const event = new CustomEvent("ira-chatbot-send", { detail: moodInput });
    window.dispatchEvent(event);
    setMoodInput("");
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
        <img src={heroBanner} alt="IRA Clothing hero" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-xl animate-fade-in">
            <p className="font-body text-xs uppercase tracking-[0.25em] text-gold-light mb-4">New Collection 2026</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground leading-[1.1] mb-6">
              Wear Your<br />Intelligence
            </h1>
            <p className="font-body text-primary-foreground/70 text-lg mb-8 max-w-md">
              AI-curated fashion for the modern individual. Premium quality meets intelligent style.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop"><Button variant="hero" size="lg" className="px-10 py-6 bg-primary-foreground text-foreground hover:bg-primary-foreground/90">Shop Collection</Button></Link>
              <Link to="/shop"><Button variant="outline-dark" size="lg" className="px-10 py-6 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-foreground">Explore AI Stylist</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold mb-3">Collections</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-card">
              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-display text-xl text-primary-foreground font-semibold">{cat.name}</h3>
                <p className="font-body text-[11px] uppercase tracking-[0.15em] text-primary-foreground/60 mt-1 flex items-center gap-1 group-hover:text-gold transition-colors">
                  Explore <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.2em] text-gold mb-3">Curated For You</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Trending Now</h2>
          </div>
          <Link to="/shop" className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trending.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} />)}
        </div>
      </section>

      {/* AI Stylist Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-foreground rounded-2xl p-8 md:p-16 text-primary-foreground text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="text-gold" size={28} />
            </div>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">AI Stylist</h2>
          <p className="font-body text-primary-foreground/60 max-w-lg mx-auto mb-8">
            Describe your mood, occasion, or style preference and let our AI curate the perfect outfit for you.
          </p>
          <div className="max-w-md mx-auto flex gap-3">
            <input
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAIStylistSubmit()}
              placeholder="e.g. Casual brunch with friends..."
              className="flex-1 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg px-5 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <Button variant="gold" size="lg" className="px-6" onClick={handleAIStylistSubmit}>
              <Sparkles size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold mb-3">Testimonials</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-card rounded-xl p-8 shadow-soft">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-gold text-gold" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
              <p className="font-display text-sm font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-secondary rounded-2xl p-8 md:p-16 text-center">
          <Mail className="mx-auto text-gold mb-4" size={32} />
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">Stay in Style</h2>
          <p className="font-body text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Subscribe for exclusive drops, AI-curated lookbooks, and members-only discounts.
          </p>
          <div className="max-w-sm mx-auto flex gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 bg-background border border-border rounded-lg px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
            />
            <Button variant="hero" size="lg">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
