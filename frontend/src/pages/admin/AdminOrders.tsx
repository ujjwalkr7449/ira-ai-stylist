import { useEffect, useState } from "react";
import { orderApi, type ApiOrder } from "@/lib/api";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    orderApi.adminAll().then(setOrders).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await orderApi.updateStatus(id, status);
      toast.success(`Order #${id} updated to ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Orders ({orders.length})</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-body">
          <p className="text-lg">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-xl p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-base font-semibold">Order #{order.id}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[order.status] || "bg-gray-100"}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    {order.customer_name} • {order.customer_phone} • {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm font-body py-1 border-b border-border/30 last:border-0">
                    <span>{item.product_name} <span className="text-muted-foreground">({item.size}, {item.color}) x{item.quantity}</span></span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div className="text-xs font-body text-muted-foreground">
                  {order.shipping_address?.address1 && `${order.shipping_address.address1}, ${order.shipping_address.city || ""}`}
                  {order.whatsapp_sent && " • WhatsApp sent"}
                </div>
                <span className="font-display text-lg font-bold">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
