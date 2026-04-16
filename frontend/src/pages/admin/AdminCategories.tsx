import { useEffect, useState } from "react";
import { categoryApi, type ApiCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const AdminCategories = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", image_url: "" });

  const load = () => { categoryApi.list().then(setCategories).catch(console.error).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: "", slug: "", image_url: "" }); setEditId(null); setShowForm(false); };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await categoryApi.update(editId, form);
        toast.success("Category updated");
      } else {
        await categoryApi.create(form);
        toast.success("Category created");
      }
      resetForm();
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try { await categoryApi.delete(id); toast.success("Category deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground";

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Categories ({categories.length})</h1>
        <Button variant="hero" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-6 shadow-soft mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold">{editId ? "Edit Category" : "New Category"}</h3>
            <button onClick={resetForm}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className={inputClass} />
            <input placeholder="Slug *" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
            <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputClass} />
          </div>
          <Button variant="hero" size="sm" className="mt-3" onClick={handleSubmit} disabled={!form.name || !form.slug}>
            {editId ? "Update" : "Create"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl overflow-hidden shadow-soft group">
            <div className="aspect-[4/3] bg-secondary overflow-hidden">
              {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold">{cat.name}</h3>
                <p className="font-body text-xs text-muted-foreground">/{cat.slug}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm({ name: cat.name, slug: cat.slug, image_url: cat.image_url }); setEditId(cat.id); setShowForm(true); }} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                <button onClick={() => deleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
