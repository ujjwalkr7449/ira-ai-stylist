import { useEffect, useRef, useState } from "react";
import { productApi, categoryApi, uploadApi, type ApiProduct, type ApiCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Plus, Pencil, Trash2, X, Upload, ImagePlus, Check,
  ChevronDown, ChevronUp, Eye, EyeOff, Package, Tag, Palette,
} from "lucide-react";
import { toast } from "sonner";

// ── Preset sizes ──────────────────────────────────────────
const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40", "Free Size"];

// ── Preset color palette ──────────────────────────────────
const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Royal Blue", hex: "#4169E1" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Red", hex: "#C0392B" },
  { name: "Maroon", hex: "#800000" },
  { name: "Pink", hex: "#FFB6C1" },
  { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Purple", hex: "#6B21A8" },
  { name: "Lavender", hex: "#E6E6FA" },
  { name: "Green", hex: "#2D6A4F" },
  { name: "Mint", hex: "#98D8C8" },
  { name: "Olive", hex: "#808000" },
  { name: "Yellow", hex: "#FFD700" },
  { name: "Orange", hex: "#FF8C00" },
  { name: "Coral", hex: "#FF6B6B" },
  { name: "Sand", hex: "#C2B280" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Brown", hex: "#795548" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Grey", hex: "#9E9E9E" },
  { name: "Silver", hex: "#C0C0C0" },
];

interface ColorItem { name: string; hex: string }

interface FormState {
  name: string;
  price: string;
  original_price: string;
  category_id: string;
  sizes: string[];
  colors: ColorItem[];
  description: string;
  tags: string;
  stock: string;
  is_active: boolean;
  // image state managed separately
}

const emptyForm = (): FormState => ({
  name: "",
  price: "",
  original_price: "",
  category_id: "",
  sizes: [],
  colors: [],
  description: "",
  tags: "",
  stock: "100",
  is_active: true,
});

// ── Image Upload Card ─────────────────────────────────────
function ImageUploadCard({
  url,
  onUpload,
  onRemove,
  label = "Upload Image",
}: {
  url: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      // Use relative URL so it works via Vite proxy
      onUpload(res.url.startsWith("http") ? res.url : res.url);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="relative group">
      {url ? (
        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-border bg-secondary">
          <img src={url} alt="product" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 text-black rounded-full p-1.5 hover:bg-white transition-colors"
              title="Replace"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={onRemove}
              className="bg-red-500/90 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
            ${drag ? "border-gold bg-gold/5 scale-[1.02]" : "border-border hover:border-gold/60 hover:bg-secondary/50"}`}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImagePlus size={20} className="text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground text-center px-2">{label}</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
const AdminProducts = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [mainImage, setMainImage] = useState("");
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState({ name: "", hex: "#000000" });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const load = () => {
    Promise.all([productApi.listAll(), categoryApi.list()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setMainImage("");
    setExtraImages([]);
    setEditId(null);
    setShowForm(false);
    setShowColorPicker(false);
  };

  const editProduct = (p: ApiProduct) => {
    setForm({
      name: p.name,
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      category_id: p.category_id ? String(p.category_id) : "",
      sizes: p.sizes || [],
      colors: (p.colors as ColorItem[]) || [],
      description: p.description,
      tags: p.tags.join(", "),
      stock: String(p.stock),
      is_active: p.is_active,
    });
    setMainImage(p.image_url);
    setExtraImages(p.images.filter((img) => img !== p.image_url));
    setEditId(p.id);
    setShowForm(true);
  };

  const toggleSize = (s: string) =>
    setForm((f) => ({ ...f, sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s] }));

  const togglePresetColor = (c: ColorItem) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.some((x) => x.hex === c.hex)
        ? f.colors.filter((x) => x.hex !== c.hex)
        : [...f.colors, c],
    }));

  const addCustomColor = () => {
    if (!customColor.name.trim()) { toast.error("Enter color name"); return; }
    if (form.colors.some((c) => c.hex === customColor.hex)) { toast.error("Color already added"); return; }
    setForm((f) => ({ ...f, colors: [...f.colors, { ...customColor }] }));
    setCustomColor({ name: "", hex: "#000000" });
  };

  const removeColor = (hex: string) =>
    setForm((f) => ({ ...f, colors: f.colors.filter((c) => c.hex !== hex) }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error("Valid price is required"); return; }

    const allImages = mainImage ? [mainImage, ...extraImages.filter(Boolean)] : extraImages.filter(Boolean);

    const data = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      image_url: mainImage || allImages[0] || "",
      images: allImages,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      sizes: form.sizes,
      colors: form.colors,
      description: form.description.trim(),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      stock: parseInt(form.stock) || 100,
      is_active: form.is_active,
    };

    try {
      if (editId) {
        await productApi.update(editId, data);
        toast.success("Product updated!");
      } else {
        await productApi.create(data);
        toast.success("Product created!");
      }
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try { await productApi.delete(id); toast.success("Product deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const toggleActive = async (p: ApiProduct) => {
    try {
      await productApi.update(p.id, { is_active: !p.is_active });
      toast.success(p.is_active ? "Product hidden" : "Product published");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const discount = form.price && form.original_price
    ? Math.round((1 - parseFloat(form.price) / parseFloat(form.original_price)) * 100)
    : 0;

  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground transition-colors";

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">
          Products <span className="text-muted-foreground font-normal text-lg">({products.length})</span>
        </h1>
        <Button variant="hero" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          placeholder="Search products by name or category…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* ────────────── FORM MODAL ────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-6 pb-10 px-4 overflow-y-auto">
          <div className="bg-card rounded-2xl w-full max-w-3xl shadow-2xl">
            {/* Form Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display text-xl font-semibold">
                {editId ? "Edit Product" : "New Product"}
              </h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* ── Images Section ── */}
              <div>
                <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                  <ImagePlus size={13} /> Product Images
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {/* Main image */}
                  <div className="col-span-2 row-span-2" style={{ gridRow: "1 / 3" }}>
                    <div className="relative">
                      <ImageUploadCard
                        url={mainImage}
                        onUpload={setMainImage}
                        onRemove={() => setMainImage("")}
                        label="Main Photo"
                      />
                      {mainImage && (
                        <span className="absolute top-2 left-2 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full">MAIN</span>
                      )}
                    </div>
                  </div>
                  {/* Extra images */}
                  {[0, 1, 2].map((i) => (
                    <ImageUploadCard
                      key={i}
                      url={extraImages[i] || ""}
                      onUpload={(url) => setExtraImages((prev) => {
                        const next = [...prev];
                        next[i] = url;
                        return next;
                      })}
                      onRemove={() => setExtraImages((prev) => {
                        const next = [...prev];
                        next[i] = "";
                        return next.filter((_, idx) => idx !== i);
                      })}
                      label="Photo"
                    />
                  ))}
                </div>
              </div>

              {/* ── Basic Info ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Product Name *</label>
                  <input
                    placeholder="e.g. Premium Cotton Kurta"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Selling Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 2499"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClass}
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center justify-between">
                    <span>Original / MRP (₹)</span>
                    {discount > 0 && (
                      <span className="text-emerald-500 font-medium">{discount}% OFF</span>
                    )}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3499"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    className={inputClass}
                    min="0"
                  />
                </div>
              </div>

              {/* ── Category & Stock ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Stock Quantity</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setForm((f) => ({ ...f, stock: String(Math.max(0, parseInt(f.stock || "0") - 1)) }))}
                      className="w-8 h-9 rounded-lg border border-border hover:border-foreground transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className={`${inputClass} text-center`}
                      min="0"
                    />
                    <button
                      onClick={() => setForm((f) => ({ ...f, stock: String(parseInt(f.stock || "0") + 1) }))}
                      className="w-8 h-9 rounded-lg border border-border hover:border-foreground transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Sizes ── */}
              <div>
                <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                  <Tag size={13} /> Available Sizes
                  {form.sizes.length > 0 && (
                    <span className="text-gold font-medium">({form.sizes.length} selected)</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all duration-200 ${
                        form.sizes.includes(s)
                          ? "border-gold bg-gold text-black shadow-sm scale-105"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                      {form.sizes.includes(s) && <Check size={10} className="inline ml-1" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Colors ── */}
              <div>
                <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                  <Palette size={13} /> Colors
                  {form.colors.length > 0 && (
                    <span className="text-gold font-medium">({form.colors.length} selected)</span>
                  )}
                </p>

                {/* Selected colors */}
                {form.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.colors.map((c) => (
                      <div
                        key={c.hex}
                        className="flex items-center gap-1.5 bg-secondary border border-border rounded-full pl-1.5 pr-2 py-1 text-xs"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        <button onClick={() => removeColor(c.hex)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preset palette */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((c) => {
                    const selected = form.colors.some((x) => x.hex === c.hex);
                    return (
                      <button
                        key={c.hex}
                        title={c.name}
                        onClick={() => togglePresetColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          selected ? "border-gold ring-2 ring-gold/30 scale-110" : "border-border hover:border-foreground/50"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    );
                  })}
                </div>

                {/* Custom color */}
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="text-xs text-gold hover:underline flex items-center gap-1"
                >
                  {showColorPicker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Add custom color
                </button>
                {showColorPicker && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <input
                      type="color"
                      value={customColor.hex}
                      onChange={(e) => setCustomColor({ ...customColor, hex: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <input
                      placeholder="Color name (e.g. Rose Gold)"
                      value={customColor.name}
                      onChange={(e) => setCustomColor({ ...customColor, name: e.target.value })}
                      className={`${inputClass} flex-1`}
                      onKeyDown={(e) => e.key === "Enter" && addCustomColor()}
                    />
                    <Button variant="outline" size="sm" onClick={addCustomColor}>Add</Button>
                  </div>
                )}
              </div>

              {/* ── Description ── */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Describe the product — fabric, fit, occasion…"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* ── Tags ── */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Tags <span className="normal-case font-normal">(comma-separated)</span>
                </label>
                <input
                  placeholder="e.g. kurta, cotton, festive, men"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* ── Visibility ── */}
              <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  {form.is_active ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} className="text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">{form.is_active ? "Visible to shoppers" : "Hidden from shop"}</p>
                    <p className="text-xs text-muted-foreground">{form.is_active ? "Product is live on the store" : "Customers won't see this product"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.is_active ? "bg-emerald-500" : "bg-border"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${form.is_active ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>

              {/* ── Submit ── */}
              <Button
                variant="hero"
                className="w-full py-6 text-base"
                onClick={handleSubmit}
                disabled={!form.name || !form.price}
              >
                {editId ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────── PRODUCTS TABLE ────────────── */}
      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-left bg-secondary/40">
                <th className="px-4 py-3 font-medium text-muted-foreground">Image</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Sizes</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Colors</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    <Package size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No products yet. Click <strong>Add Product</strong> to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2">
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                        {p.image_url
                          ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-muted-foreground" /></div>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium max-w-[150px]">
                      <span className="line-clamp-2">{p.name}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">₹{p.price.toLocaleString()}</div>
                      {p.original_price && (
                        <div className="text-xs text-muted-foreground line-through">₹{p.original_price.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">{p.category_name || "—"}</td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.sizes || []).slice(0, 4).map((s) => (
                          <span key={s} className="text-[10px] bg-secondary border border-border rounded px-1.5 py-0.5">{s}</span>
                        ))}
                        {(p.sizes || []).length > 4 && (
                          <span className="text-[10px] text-muted-foreground">+{p.sizes.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell">
                      <div className="flex gap-1">
                        {(p.colors as ColorItem[] || []).slice(0, 5).map((c) => (
                          <div
                            key={c.hex}
                            title={c.name}
                            className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                        {(p.colors || []).length > 5 && (
                          <span className="text-[10px] text-muted-foreground self-center">+{p.colors.length - 5}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        p.stock <= 5 ? "bg-red-500/10 text-red-500" :
                        p.stock <= 20 ? "bg-amber-500/10 text-amber-500" :
                        "bg-emerald-500/10 text-emerald-600"
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleActive(p)}
                        title={p.is_active ? "Hide" : "Publish"}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-colors border ${
                          p.is_active
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                            : "bg-secondary text-muted-foreground border-border hover:bg-emerald-500/10 hover:text-emerald-600"
                        }`}
                      >
                        {p.is_active ? "Live" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editProduct(p)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
