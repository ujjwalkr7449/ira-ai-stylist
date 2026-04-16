import { useParams, Link } from "react-router-dom";
import { productApi, type ApiProduct } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Star, ShoppingBag, Sparkles, ChevronLeft, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [suggestions, setSuggestions] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi.get(parseInt(id))
      .then((p) => {
        setProduct(p);
        // Load suggestions from same category
        if (p.category_name) {
          productApi.list({ category: p.category_name.toLowerCase() })
            .then((all) => setSuggestions(all.filter((s) => s.id !== p.id).slice(0, 4)));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-2xl">Product not found</h1>
      <Link to="/shop" className="text-gold text-sm mt-4 inline-block hover:underline">Back to shop</Link>
    </div>
  );

  const wishlisted = isInWishlist(String(product.id));
  const cardProduct = toCardProduct(product);

  const handleAdd = () => {
    if (!selectedSize || !selectedColor) {
      toast.error("Please select a size and color");
      return;
    }
    addItem(cardProduct, selectedSize, selectedColor);
    setAdded(true);
    toast.success(`${product.name} added to cart!`, { description: `Size: ${selectedSize} · Color: ${selectedColor}` });
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    toggleItem(cardProduct);
    if (!wishlisted) toast.success(`${product.name} added to wishlist`);
    else toast("Removed from wishlist");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/shop" className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ChevronLeft size={14} /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card shadow-soft">
            <img src={product.images[selectedImage] || product.image_url} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? "border-gold" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center">
          <p className="font-body text-xs uppercase tracking-[0.15em] text-gold mb-2">{product.category_name}</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < Math.floor(product.rating) ? "fill-gold text-gold" : "text-border"} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground font-body">{product.rating} ({product.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <span className="font-display text-2xl font-bold">₹{product.price.toLocaleString()}</span>
            {product.original_price && (
              <span className="font-body text-lg text-muted-foreground line-through">₹{product.original_price.toLocaleString()}</span>
            )}
          </div>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">{product.description}</p>

          {/* Color */}
          <div className="mb-6">
            <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Color</p>
            <div className="flex gap-3">
              {(product.colors || []).map((c: any) => (
                <button key={c.name} onClick={() => setSelectedColor(c.name)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c.name ? "border-foreground scale-110" : "border-border"}`}
                  style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-8">
            <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Size</p>
            <div className="flex flex-wrap gap-2">
              {(product.sizes || []).map((s) => (
                <button key={s} onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 text-sm rounded-lg border-2 font-body transition-all ${selectedSize === s ? "border-foreground bg-foreground text-primary-foreground" : "border-border hover:border-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="hero" size="lg" className="flex-1 py-6" onClick={handleAdd} disabled={!selectedSize || !selectedColor}>
              <ShoppingBag size={18} />
              {added ? "Added to Cart" : "Add to Cart"}
            </Button>
            <Button variant={wishlisted ? "destructive" : "outline"} size="lg" className="py-6 px-5" onClick={handleWishlist}>
              <Heart size={18} className={wishlisted ? "fill-current" : ""} />
            </Button>
          </div>

          {/* AI Suggestion */}
          {suggestions.length > 0 && (
            <div className="mt-8 bg-secondary rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <Sparkles className="text-gold" size={18} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold mb-1">AI Suggestion: Match This With</p>
                <p className="font-body text-sm text-muted-foreground">
                  Pair with the {suggestions[0].name} for a complete look. The {suggestions[0].colors?.[0]?.name || "neutral"} tone complements perfectly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-border pt-12 mb-16">
        <h2 className="font-display text-2xl font-semibold mb-8">Customer Reviews</h2>
        <div className="space-y-6">
          {[
            { name: "Aisha K.", rating: 5, text: "Absolutely love the quality. Fits perfectly and the fabric feels premium." },
            { name: "Rahul T.", rating: 4, text: "Great piece, true to size. Shipping was fast too." },
            { name: "Maria C.", rating: 5, text: "This is now my go-to. The versatility is amazing." },
          ].map((r, i) => (
            <div key={i} className="bg-card rounded-xl p-6 shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-display text-sm font-semibold">{r.name}</span>
                <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={12} className="fill-gold text-gold" />)}</div>
              </div>
              <p className="font-body text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {suggestions.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
