import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { productApi, categoryApi, type ApiProduct, type ApiCategory } from "@/lib/api";
import { SlidersHorizontal, X, ChevronDown, LayoutGrid, LayoutList, Search } from "lucide-react";

const priceRanges = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 – ₹3,000", min: 1000, max: 3000 },
  { label: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
  { label: "₹6,000 – ₹10,000", min: 6000, max: 10000 },
  { label: "Above ₹10,000", min: 10000, max: Infinity },
];

const allSizes = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "Free Size"];

type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";

const sortLabels: Record<SortOption, string> = {
  newest: "Newest First",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A–Z",
};

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("newest");
  const [search, setSearch] = useState(searchParam || "");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3>(3);

  useEffect(() => {
    setLoading(true);
    Promise.all([productApi.list({ category: selectedCategory || undefined }), categoryApi.list()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => { 
    setSelectedCategory(categoryParam); 
    if (searchParam !== null) {
      setSearch(searchParam);
    }
  }, [categoryParam, searchParam]);

  // Collect unique colors from all products
  const allColors = useMemo(() => {
    const colorMap = new Map<string, { name: string; hex: string }>();
    products.forEach((p) =>
      (p.colors as { name: string; hex: string }[] || []).forEach((c) => {
        if (!colorMap.has(c.hex)) colorMap.set(c.hex, c);
      })
    );
    return Array.from(colorMap.values()).slice(0, 20);
  }, [products]);

  const toggleColor = (hex: string) =>
    setSelectedColors((prev) => prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      // Price
      if (selectedPriceRange !== null) {
        const range = priceRanges[selectedPriceRange];
        if (p.price < range.min || p.price >= range.max) return false;
      }
      // Size
      if (selectedSize && !(p.sizes || []).includes(selectedSize)) return false;
      // Color
      if (selectedColors.length > 0) {
        const pHexes = (p.colors as { hex: string }[] || []).map((c) => c.hex);
        if (!selectedColors.some((hex) => pHexes.includes(hex))) return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) ||
          (p.category_name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q);
      }
      return true;
    });

    // Sort
    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [products, selectedPriceRange, selectedSize, selectedColors, sort, search]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedPriceRange(null);
    setSelectedSize(null);
    setSelectedColors([]);
    setSearch("");
  };

  const hasFilters = selectedCategory || selectedPriceRange !== null || selectedSize || selectedColors.length > 0 || search;
  const activeFilterCount = [
    selectedCategory,
    selectedPriceRange !== null ? true : null,
    selectedSize,
    selectedColors.length > 0 ? true : null,
    search ? true : null,
  ].filter(Boolean).length;

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-body text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">
          {selectedCategory
            ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
            : "All Products"}
        </span>
      </div>

      {/* Page Title + Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">
          {selectedCategory
            ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
            : "Shop All"}
        </h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search products…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) newParams.set("search", e.target.value);
                else newParams.delete("search");
                setSearchParams(newParams, { replace: true });
              }}
              className="pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold w-44 placeholder:text-muted-foreground transition-all focus:w-56"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 text-sm font-body border border-border rounded-lg px-3 py-2 hover:border-foreground transition-colors bg-card"
            >
              <span className="text-muted-foreground hidden sm:block">Sort:</span>
              <span>{sortLabels[sort]}</span>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-hover z-20 overflow-hidden min-w-[180px]">
                {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSort(key); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors ${sort === key ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid Toggle */}
          <div className="hidden md:flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <button
              onClick={() => setGridCols(3)}
              className={`p-1.5 rounded-md transition-colors ${gridCols === 3 ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setGridCols(2)}
              className={`p-1.5 rounded-md transition-colors ${gridCols === 2 ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList size={14} />
            </button>
          </div>

          {/* Mobile filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.1em] border border-border rounded-lg px-3 py-2 lg:hidden bg-card hover:border-foreground transition-colors"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-gold text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="relative md:hidden mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            const newParams = new URLSearchParams(searchParams);
            if (e.target.value) newParams.set("search", e.target.value);
            else newParams.delete("search");
            setSearchParams(newParams, { replace: true });
          }}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-8">
        {/* ── SIDEBAR FILTERS ── */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-60 shrink-0 space-y-8`}>
          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-body text-gold hover:text-foreground transition-colors font-medium"
            >
              <X size={13} /> Clear all filters
              {activeFilterCount > 0 && (
                <span className="bg-gold/10 text-gold text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Category */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 font-medium">Category</h4>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`block w-full text-left text-sm font-body transition-colors px-3 py-1.5 rounded-lg ${
                  !selectedCategory ? "bg-foreground text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                All Products
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(selectedCategory === c.slug ? null : c.slug)}
                  className={`block w-full text-left text-sm font-body transition-colors px-3 py-1.5 rounded-lg ${
                    selectedCategory === c.slug ? "bg-foreground text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 font-medium">Price Range</h4>
            <div className="space-y-1.5">
              {priceRanges.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPriceRange(selectedPriceRange === i ? null : i)}
                  className={`flex items-center gap-2 w-full text-left text-sm font-body transition-colors px-3 py-1.5 rounded-lg ${
                    selectedPriceRange === i ? "bg-foreground text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 font-medium">Size</h4>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                  className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all ${
                    selectedSize === s
                      ? "border-foreground bg-foreground text-primary-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          {allColors.length > 0 && (
            <div>
              <h4 className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 font-medium">Color</h4>
              <div className="flex flex-wrap gap-2">
                {allColors.map((c) => {
                  const isSelected = selectedColors.includes(c.hex);
                  return (
                    <button
                      key={c.hex}
                      title={c.name}
                      onClick={() => toggleColor(c.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        isSelected ? "border-gold ring-2 ring-gold/30 scale-110" : "border-border hover:border-foreground/40"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
              {selectedColors.length > 0 && (
                <button
                  onClick={() => setSelectedColors([])}
                  className="text-xs text-gold hover:underline mt-2"
                >
                  Clear colors
                </button>
              )}
            </div>
          )}
        </aside>

        {/* ── PRODUCT GRID ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading products…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground font-body">
                  <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                  product{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-24 bg-card rounded-2xl">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="font-display text-xl text-muted-foreground mb-2">No products found</p>
                  <p className="text-sm text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gold font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-6 ${
                    gridCols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"
                  }`}
                >
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={toCardProduct(p)} />
                  ))}
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
