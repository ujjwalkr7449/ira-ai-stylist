import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi, type ApiProduct } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import {
  Star, ShoppingBag, Sparkles, ChevronLeft, Heart,
  Zap, Share2, Check, ChevronRight, ZoomIn, Truck,
  RotateCcw, Shield,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const toCardProduct = (p: ApiProduct) => ({
  id: String(p.id),
  name: p.name,
  price: p.price,
  originalPrice: p.original_price ?? undefined,
  image: p.image_url,
  images: p.images,
  category: (p.category_name?.toLowerCase() || "other") as any,
  sizes: p.sizes,
  colors: p.colors,
  description: p.description,
  rating: p.rating,
  reviews: p.reviews,
  tags: p.tags,
});

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [suggestions, setSuggestions] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [justShared, setJustShared] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setSelectedSize("");
    setSelectedColor(null);
    setSelectedImage(0);
    productApi.get(parseInt(id))
      .then((p) => {
        setProduct(p);
        if (p.category_name) {
          productApi.list({ category: p.category_name.toLowerCase() })
            .then((all) => setSuggestions(all.filter((s) => s.id !== p.id).slice(0, 4)));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Keyboard navigation for gallery
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!product) return;
    const allImages = product.images.length > 0 ? product.images : [product.image_url];
    if (e.key === "ArrowLeft") setSelectedImage((i) => Math.max(0, i - 1));
    if (e.key === "ArrowRight") setSelectedImage((i) => Math.min(allImages.length - 1, i + 1));
    if (e.key === "Escape") setZoom(false);
  }, [product]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  if (loading) return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🛍️</div>
      <h1 className="font-display text-2xl mb-4">Product not found</h1>
      <Link to="/shop" className="text-gold text-sm hover:underline">← Back to shop</Link>
    </div>
  );

  const allImages = product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : [];
  const currentImg = allImages[selectedImage] || "";

  const wishlisted = isInWishlist(String(product.id));
  const cardProduct = toCardProduct(product);
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const handleAdd = () => {
    if (!selectedSize) { toast.error("Please select a size"); return; }
    if (!selectedColor) { toast.error("Please select a color"); return; }
    addItem(cardProduct, selectedSize, selectedColor.name);
    setAddedToCart(true);
    toast.success(`Added to cart!`, {
      description: `${product.name} · ${selectedSize} · ${selectedColor.name}`,
    });
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = () => {
    if (!selectedSize) { toast.error("Please select a size"); return; }
    if (!selectedColor) { toast.error("Please select a color"); return; }
    addItem(cardProduct, selectedSize, selectedColor.name);
    navigate("/checkout");
  };

  const handleWishlist = () => {
    toggleItem(cardProduct);
    if (!wishlisted) toast.success(`${product.name} added to wishlist`);
    else toast("Removed from wishlist");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      setJustShared(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setJustShared(false), 2000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ChevronLeft size={14} /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
        {/* ── Image Gallery ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div
            className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-card shadow-soft cursor-zoom-in`}
            onClick={() => setZoom(!zoom)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={currentImg}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 ${zoom ? "scale-150" : "scale-100 hover:scale-105"}`}
              style={zoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {discount > 0 && (
                <span className="bg-gold text-black text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {discount}% OFF
                </span>
              )}
              {product.stock <= 5 && product.stock > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow animate-pulse">
                  Only {product.stock} left!
                </span>
              )}
              {product.stock === 0 && (
                <span className="bg-foreground text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  Out of Stock
                </span>
              )}
            </div>
            {/* Zoom indicator */}
            <div className="absolute bottom-3 right-3 bg-black/40 text-white rounded-full p-1.5">
              <ZoomIn size={14} />
            </div>
            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.max(0, i - 1)); }}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 transition-all hover:bg-black/70 ${selectedImage === 0 ? "opacity-30" : ""}`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.min(allImages.length - 1, i + 1)); }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 transition-all hover:bg-black/70 ${selectedImage === allImages.length - 1 ? "opacity-30" : ""}`}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    i === selectedImage ? "border-gold shadow-md scale-[1.02]" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Image counter dots */}
          {allImages.length > 1 && (
            <div className="flex justify-center gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`rounded-full transition-all ${i === selectedImage ? "w-5 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Product Details ── */}
        <div className="flex flex-col">
          {/* Category + Name */}
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold mb-2">{product.category_name}</p>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight">{product.name}</h1>
            <button
              onClick={handleShare}
              className="shrink-0 p-2 rounded-xl border border-border hover:border-foreground transition-colors text-muted-foreground hover:text-foreground"
              title="Share"
            >
              {justShared ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(product.rating) ? "fill-gold text-gold" : "text-border"}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground font-body">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="font-display text-3xl font-bold">₹{product.price.toLocaleString()}</span>
            {product.original_price && (
              <>
                <span className="font-body text-lg text-muted-foreground line-through">
                  ₹{product.original_price.toLocaleString()}
                </span>
                <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Color Selector */}
          {(product.colors || []).length > 0 && (
            <div className="mb-6">
              <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center justify-between">
                <span>Color</span>
                {selectedColor && <span className="normal-case text-foreground font-medium">{selectedColor.name}</span>}
              </p>
              <div className="flex flex-wrap gap-3">
                {(product.colors as { name: string; hex: string }[] || []).map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c)}
                    title={c.name}
                    className={`relative w-10 h-10 rounded-full border-3 transition-all duration-200 hover:scale-110 ${
                      selectedColor?.name === c.name
                        ? "border-foreground scale-110 ring-2 ring-foreground/20"
                        : "border-border/60 hover:border-foreground/50"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor?.name === c.name && (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white drop-shadow" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {(product.sizes || []).length > 0 && (
            <div className="mb-8">
              <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center justify-between">
                <span>Size</span>
                {selectedSize && (
                  <span className="normal-case text-foreground font-medium">Selected: {selectedSize}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || []).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 text-sm rounded-xl border-2 font-body transition-all duration-200 ${
                      selectedSize === s
                        ? "border-foreground bg-foreground text-primary-foreground shadow-sm scale-105"
                        : "border-border hover:border-foreground hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              variant="hero"
              size="lg"
              className="flex-1 py-6 text-base gap-2"
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              {addedToCart ? (
                <><Check size={18} /> Added!</>
              ) : (
                <><ShoppingBag size={18} /> Add to Cart</>
              )}
            </Button>
            <Button
              variant="gold"
              size="lg"
              className="flex-1 py-6 text-base gap-2"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              <Zap size={18} /> Buy Now
            </Button>
            <Button
              variant={wishlisted ? "destructive" : "outline"}
              size="lg"
              className="py-6 px-5"
              onClick={handleWishlist}
            >
              <Heart size={18} className={wishlisted ? "fill-current" : ""} />
            </Button>
          </div>

          {product.stock === 0 && (
            <p className="text-center text-sm text-red-500 font-medium -mt-2 mb-4">
              ⚠️ This product is currently out of stock
            </p>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 py-5 border-t border-border">
            <div className="flex flex-col items-center text-center gap-1.5">
              <Truck size={18} className="text-gold" />
              <span className="text-xs text-muted-foreground font-body leading-tight">Free Delivery<br />above ₹999</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <RotateCcw size={18} className="text-gold" />
              <span className="text-xs text-muted-foreground font-body leading-tight">Easy 7-Day<br />Returns</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <Shield size={18} className="text-gold" />
              <span className="text-xs text-muted-foreground font-body leading-tight">100% Authentic<br />Products</span>
            </div>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* AI Suggestion */}
          {suggestions.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-gold/5 to-transparent border border-gold/20 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <Sparkles className="text-gold" size={18} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold mb-1">AI Stylist Suggestion</p>
                <p className="font-body text-sm text-muted-foreground">
                  Pair this with{" "}
                  <Link to={`/product/${suggestions[0].id}`} className="text-gold hover:underline font-medium">
                    {suggestions[0].name}
                  </Link>{" "}
                  for a complete look. The {(suggestions[0].colors as { name: string }[])?.[0]?.name || "neutral"} tone complements perfectly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      <div className="border-t border-border pt-12 mb-16">
        <h2 className="font-display text-2xl font-semibold mb-8">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Aisha K.", rating: 5, text: "Absolutely love the quality. Fits perfectly and the fabric feels premium.", date: "2 days ago" },
            { name: "Rahul T.", rating: 4, text: "Great piece, true to size. Shipping was fast too. Really happy with this purchase.", date: "1 week ago" },
            { name: "Maria C.", rating: 5, text: "This is now my go-to. The versatility is amazing — dressed up or down perfectly.", date: "2 weeks ago" },
          ].map((r, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                    {r.name[0]}
                  </div>
                  <span className="font-display text-sm font-semibold">{r.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} size={12} className="fill-gold text-gold" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">"{r.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Suggestions ── */}
      {suggestions.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-semibold">You Might Also Like</h2>
            <Link to="/shop" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {suggestions.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
