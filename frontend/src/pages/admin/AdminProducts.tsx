import { useEffect, useState } from "react";
import { productApi, categoryApi, type ApiProduct, type ApiCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

const AdminProducts = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [scanImage, setScanImage] = useState<File | null>(null);
  const [scanDescription, setScanDescription] = useState("");
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({
    name: "", price: "", original_price: "", image_url: "", images: "",
    category_id: "", sizes: "", colors_text: "", description: "", tags: "", stock: "100",
  });

  const load = () => {
    Promise.all([productApi.listAll(), categoryApi.list()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", price: "", original_price: "", image_url: "", images: "", category_id: "", sizes: "", colors_text: "", description: "", tags: "", stock: "100" });
    setEditId(null);
    setShowForm(false);
    setScanImage(null);
    setScanDescription("");
  };

  const editProduct = (p: ApiProduct) => {
    setForm({
      name: p.name,
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      image_url: p.image_url,
      images: p.images.join(", "),
      category_id: p.category_id ? String(p.category_id) : "",
      sizes: p.sizes.join(", "),
      colors_text: p.colors.map((c: any) => `${c.name}:${c.hex}`).join(", "),
      description: p.description,
      tags: p.tags.join(", "),
      stock: String(p.stock),
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const runStyleScan = async () => {
    if (!scanImage) {
      toast.error("Please upload an image first");
      return;
    }

    try {
      setScanning(true);
      const result = await productApi.styleScan(scanImage, scanDescription);
      setForm((prev) => ({
        ...prev,
        name: result.suggested_name,
        description: result.suggested_description,
        image_url: result.uploaded_image_url,
        images: result.uploaded_image_url,
        category_id: result.suggested_category_id ? String(result.suggested_category_id) : prev.category_id,
        tags: result.suggested_tags.join(", "),
        sizes: result.suggested_sizes.join(", "),
        colors_text: result.suggested_colors.map((c) => `${c.name}:${c.hex}`).join(", "),
      }));
      toast.success("AI scan completed and form auto-filled");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async () => {
    const colors = form.colors_text.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
      const [name, hex] = s.split(":");
      return { name: name?.trim() || "", hex: hex?.trim() || "#000000" };
    });
    const data = {
      name: form.name,
      price: parseFloat(form.price) || 0,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      image_url: form.image_url,
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors,
      description: form.description,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      stock: parseInt(form.stock) || 100,
    };
    try {
      if (editId) {
        await productApi.update(editId, data);
        toast.success("Product updated");
      } else {
        await productApi.create(data);
        toast.success("Product created");
      }
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productApi.delete(id);
      toast.success("Product deleted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground";

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Products ({products.length})</h1>
        <Button variant="hero" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4 overflow-y-auto">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-hover mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">{editId ? "Edit Product" : "New Product"}</h2>
              <button onClick={resetForm}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {!editId && (
                <div className="border border-border rounded-xl p-3 bg-secondary/30 space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">AI Style Scan</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScanImage(e.target.files?.[0] || null)}
                    className={inputClass}
                  />
                  <textarea
                    rows={2}
                    placeholder="Describe mood/occasion (e.g. modern summer party look)"
                    value={scanDescription}
                    onChange={(e) => setScanDescription(e.target.value)}
                    className={inputClass}
                  />
                  <Button variant="outline" className="w-full" onClick={runStyleScan} disabled={scanning}>
                    {scanning ? <><Upload size={16} className="animate-pulse" /> Scanning...</> : <><Sparkles size={16} /> Scan & Autofill Product</>}
                  </Button>
                </div>
              )}

              <input placeholder="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Price *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
                <input placeholder="Original Price" type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className={inputClass} />
              </div>
              <input placeholder="Main Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputClass} />
              <input placeholder="Additional Images (comma-separated URLs)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className={inputClass} />
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Sizes (e.g. S, M, L, XL)" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={inputClass} />
              <input placeholder="Colors (e.g. Sand:#C2B280, Charcoal:#36454F)" value={form.colors_text} onChange={(e) => setForm({ ...form, colors_text: e.target.value })} className={inputClass} />
              <textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
              <input placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputClass} />
              <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} />
              <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={!form.name || !form.price}>
                {editId ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Image</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2">
                    <div className="w-12 h-14 rounded-md overflow-hidden bg-secondary">
                      {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">₹{p.price.toLocaleString()}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.category_name || "-"}</td>
                  <td className="px-4 py-2">{p.stock}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => editProduct(p)} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
