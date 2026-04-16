import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { productApi, type ApiProduct } from "@/lib/api";
import { SlidersHorizontal, X } from "lucide-react";

const priceRanges = [
  { label: "Under ₹3,000", min: 0, max: 3000 },
  { label: "₹3,000 - ₹6,000", min: 3000, max: 6000 },
  { label: "₹6,000 - ₹10,000", min: 6000, max: 10000 },
  { label: "Above ₹10,000", min: 10000, max: Infinity },
];

const allSizes = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36"];

const ShopPage = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    productApi.list({ category: selectedCategory || undefined })
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  // Update selectedCategory when URL param changes
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedPriceRange !== null) {
        const range = priceRanges[selectedPriceRange];
        if (p.price < range.min || p.price >= range.max) return false;
      }
      if (selectedSize && !(p.sizes || []).includes(selectedSize)) return false;
      return true;
    });
  }, [products, selectedPriceRange, selectedSize]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedPriceRange(null);
    setSelectedSize(null);
  };

  const hasFilters = selectedCategory || selectedPriceRange !== null || selectedSize;

  // Convert API product to the format ProductCard expects
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-body text-muted-foreground mb-8">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">Shop {selectedCategory ? `/ ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}` : ""}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">
          {selectedCategory ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : "All Products"}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-56 shrink-0 space-y-8`}>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-body text-gold hover:text-foreground transition-colors">
              <X size={12} /> Clear all filters
            </button>
          )}

          {/* Category */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Category</h4>
            <div className="space-y-2">
              {["men", "women", "streetwear", "formal"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                  className={`block text-sm font-body transition-colors ${selectedCategory === c ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Price</h4>
            <div className="space-y-2">
              {priceRanges.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPriceRange(selectedPriceRange === i ? null : i)}
                  className={`block text-sm font-body transition-colors ${selectedPriceRange === i ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Size</h4>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${selectedSize === s ? "border-foreground bg-foreground text-primary-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6 font-body">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-display text-xl text-muted-foreground">No products found</p>
                  <button onClick={clearFilters} className="mt-4 text-sm text-gold hover:underline">Clear filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {filtered.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
