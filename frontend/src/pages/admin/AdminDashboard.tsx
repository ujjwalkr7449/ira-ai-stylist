import { useEffect, useState } from "react";
import { orderApi, type AdminStats } from "@/lib/api";
import { Package, ShoppingCart, Users, IndianRupee, Clock } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.stats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { label: "Total Products", value: stats?.total_products ?? 0, icon: Package, color: "bg-blue-500" },
    { label: "Total Orders", value: stats?.total_orders ?? 0, icon: ShoppingCart, color: "bg-green-500" },
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "bg-purple-500" },
    { label: "Revenue", value: `₹${(stats?.total_revenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: "bg-gold" },
    { label: "Pending Orders", value: stats?.pending_orders ?? 0, icon: Clock, color: "bg-orange-500" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                <card.icon size={16} className="text-white" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
