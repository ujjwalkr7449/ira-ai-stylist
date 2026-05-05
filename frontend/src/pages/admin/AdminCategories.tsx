import { useEffect, useRef, useState } from "react";
import { categoryApi, uploadApi, type ApiCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, ImagePlus, FolderOpen } from "lucide-react";
import { toast } from "sonner";

// ── Image Upload ─────────────────────────────────────────
function ImageUploadCard({
  url,
  onUpload,
  onRemove,
}: {
  url: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      onUpload(res.url);  // relative /api/uploads/... works via Vite proxy
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
    <div className="relative group w-full">
      {url ? (
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-border bg-secondary">
          <img src={url} alt="category" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 text-black rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <ImagePlus size={12} /> Replace
            </button>
            <button
              onClick={onRemove}
              className="bg-red-500/90 text-white rounded-full px-3 py-1.5 text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
            ${drag ? "border-gold bg-gold/5 scale-[1.01]" : "border-border hover:border-gold/60 hover:bg-secondary/50"}`}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImagePlus size={22} className="text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground font-medium">Click or drag image here</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, WEBP</p>
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
const AdminCategories = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", image_url: "" });

  const load = () => {
    categoryApi.list().then(setCategories).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", slug: "", image_url: "" });
    setEditId(null);
    setShowForm(false);
  };

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      // Auto-generate slug only when creating (not editing)
      slug: editId ? form.slug : name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    try {
      if (editId) {
        await categoryApi.update(editId, form);
        toast.success("Category updated!");
      } else {
        await categoryApi.create(form);
        toast.success("Category created!");
      }
      resetForm();
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category? Products in this category will be uncategorized.")) return;
    try { await categoryApi.delete(id); toast.success("Category deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground transition-colors";

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
          Categories <span className="text-muted-foreground font-normal text-lg">({categories.length})</span>
        </h1>
        <Button variant="hero" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display text-xl font-semibold">
                {editId ? "Edit Category" : "New Category"}
              </h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-wider">Category Image</label>
                <ImageUploadCard
                  url={form.image_url}
                  onUpload={(url) => setForm({ ...form, image_url: url })}
                  onRemove={() => setForm({ ...form, image_url: "" })}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Name *</label>
                <input
                  placeholder="e.g. Women's Kurtas"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>URL Slug *</span>
                  <span className="normal-case font-normal text-muted-foreground/60">Used in URLs</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/shop?category=</span>
                  <input
                    placeholder="womens-kurtas"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    className={`${inputClass} pl-36`}
                  />
                </div>
              </div>

              <Button
                variant="hero"
                className="w-full py-5"
                onClick={handleSubmit}
                disabled={!form.name || !form.slug}
              >
                {editId ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORIES GRID ── */}
      {categories.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl shadow-soft">
          <FolderOpen size={40} className="mx-auto mb-4 text-muted-foreground/40" />
          <p className="font-display text-lg text-muted-foreground mb-2">No categories yet</p>
          <p className="text-sm text-muted-foreground">Create your first category to organize products</p>
          <Button variant="hero" size="sm" className="mt-6" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-hover transition-shadow group">
              {/* Image */}
              <div className="aspect-[4/3] bg-secondary overflow-hidden relative">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen size={32} className="text-muted-foreground/30" />
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setForm({ name: cat.name, slug: cat.slug, image_url: cat.image_url });
                      setEditId(cat.id);
                      setShowForm(true);
                    }}
                    className="bg-white/90 text-black rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="bg-red-500/90 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-display text-base font-semibold">{cat.name}</h3>
                <p className="font-body text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span className="opacity-50">/shop?category=</span>{cat.slug}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
