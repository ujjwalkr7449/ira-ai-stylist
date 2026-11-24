import { useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { orderApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "917979760802";

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const [form, setForm] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pin: "",
    phone: user?.phone || "",
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };



  const handleOrder = async () => {
    setSaving(true);
    try {
      const requestKey = idempotencyKey.current ?? crypto.randomUUID();
      idempotencyKey.current = requestKey;

      const order = await orderApi.create({
        items: items.map((item) => ({
          product_id: parseInt(item.product.id),
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
        shipping_address: {
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          pin: form.pin,
        },
        customer_name: `${form.firstName} ${form.lastName}`,
        customer_phone: form.phone,
      }, requestKey);

      setWhatsappSent(order.whatsapp_sent);
      setOrderPlaced(true);
      clearCart();
      idempotencyKey.current = null;
      toast.success("Your order was placed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place your order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = form.firstName && form.lastName && form.address1 && form.city && form.state && form.pin && form.phone;

  if (orderPlaced) return (
    <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
      <CheckCircle2 size={64} className="mx-auto text-green-500 mb-6" />
      <h1 className="font-display text-3xl font-bold mb-3">Order placed!</h1>
      <p className="font-body text-muted-foreground mb-4 max-w-md mx-auto">
        Your order has been saved. We'll confirm it and share payment and delivery details shortly.
      </p>
      <div className="flex items-center justify-center gap-2 text-green-600 mb-8">
        <MessageCircle size={18} />
        <span className="font-body text-sm">
          {whatsappSent ? "Order confirmation sent via WhatsApp" : "WhatsApp confirmation could not be sent"}
        </span>
      </div>
      <Link to="/shop"><Button variant="hero" size="lg" className="px-10">Continue Shopping</Button></Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-2xl">No items to checkout</h1>
      <Link to="/shop" className="text-gold text-sm mt-4 inline-block hover:underline">Back to shop</Link>
    </div>
  );

  const inputClass = "w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-10">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Shipping Address */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
            <h3 className="font-display text-lg font-semibold">Shipping Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="First Name *" value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} className={inputClass} />
              <input placeholder="Last Name *" value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} className={inputClass} />
            </div>
            <input placeholder="Address Line 1 *" value={form.address1} onChange={(e) => updateForm("address1", e.target.value)} className={inputClass} />
            <input placeholder="Address Line 2" value={form.address2} onChange={(e) => updateForm("address2", e.target.value)} className={inputClass} />
            <div className="grid grid-cols-3 gap-4">
              <input placeholder="City *" value={form.city} onChange={(e) => updateForm("city", e.target.value)} className={inputClass} />
              <input placeholder="State *" value={form.state} onChange={(e) => updateForm("state", e.target.value)} className={inputClass} />
              <input placeholder="PIN Code *" value={form.pin} onChange={(e) => updateForm("pin", e.target.value)} className={inputClass} />
            </div>
            <input placeholder="Phone Number *" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className={inputClass} />
          </div>

          {/* WhatsApp Info */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-green-800 mb-1">WhatsApp Checkout</p>
              <p className="font-body text-sm text-green-700">
                Your order details will be sent to our WhatsApp. We'll confirm your order and arrange payment & delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-card rounded-xl p-6 shadow-soft h-fit space-y-4">
          <h3 className="font-display text-lg font-semibold">Order Summary</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium">{item.product.name}</p>
                  <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity} · {item.size} · {item.color}</p>
                </div>
                <p className="font-body text-sm font-semibold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-sm font-body">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-gold">Free</span></div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
              <span>Total</span><span>₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>
          <Button
            variant="hero"
            size="lg"
            className="w-full py-5 mt-4 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleOrder}
            disabled={!isFormValid || saving}
          >
            <CheckCircle2 size={18} />
            {saving ? "Placing Order..." : "Place Order"}
          </Button>
          {!isFormValid && (
            <p className="text-xs text-center text-muted-foreground">Please fill all required fields (*) to continue</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
