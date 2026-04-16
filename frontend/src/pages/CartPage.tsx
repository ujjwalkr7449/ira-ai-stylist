import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Tag, MessageCircle } from "lucide-react";
import { useState } from "react";

const WHATSAPP_NUMBER = "917979760802";

const CartPage = () => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const discount = couponApplied ? Math.round(totalPrice * 0.1) : 0;
  const finalTotal = totalPrice - discount;

  const applyCoupon = () => {
    if (coupon.toLowerCase() === "ira10") setCouponApplied(true);
  };

  const handleQuickWhatsApp = () => {
    let message = "🛍️ *Quick Order from IRA Fashion*\n\n";
    message += "*Items:*\n";
    items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.product.name} — Size: ${item.size}, Color: ${item.color}, Qty: ${item.quantity} — ₹${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    if (couponApplied) {
      message += `\nDiscount (IRA10): -₹${discount.toLocaleString()}`;
    }
    message += `\n*Total: ₹${finalTotal.toLocaleString()}*\n`;
    message += "\nPlease share payment & delivery details. Thanks! 🙏";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (items.length === 0) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-6" />
      <h1 className="font-display text-3xl font-semibold mb-3">Your Cart is Empty</h1>
      <p className="font-body text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
      <Link to="/shop"><Button variant="hero" size="lg" className="px-10">Continue Shopping</Button></Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-10">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-4 bg-card rounded-xl p-4 shadow-soft">
              <Link to={`/product/${item.product.id}`} className="w-24 h-32 rounded-lg overflow-hidden shrink-0">
                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link to={`/product/${item.product.id}`} className="font-display text-base font-semibold hover:text-gold transition-colors">{item.product.name}</Link>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">Size: {item.size} · Color: {item.color}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="font-body text-sm w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-body text-sm font-semibold">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                    <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-xl p-6 shadow-soft h-fit space-y-5">
          <h3 className="font-display text-lg font-semibold">Order Summary</h3>
          <div className="space-y-3 text-sm font-body">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-gold">Free</span></div>
            {couponApplied && <div className="flex justify-between text-gold"><span>Discount (10%)</span><span>-₹{discount.toLocaleString()}</span></div>}
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
              <span>Total</span><span>₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Coupon */}
          <div>
            <p className="font-body text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag size={12} /> Have a coupon?</p>
            <div className="flex gap-2">
              <input
                value={coupon} onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter code"
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
              />
              <Button variant="outline" size="sm" onClick={applyCoupon} disabled={couponApplied}>
                {couponApplied ? "Applied ✓" : "Apply"}
              </Button>
            </div>
            {!couponApplied && <p className="text-[10px] text-muted-foreground mt-1">Try "IRA10" for 10% off</p>}
          </div>

          <Link to="/checkout" className="block">
            <Button variant="hero" size="lg" className="w-full py-5">Proceed to Checkout</Button>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or</span></div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full py-5 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={handleQuickWhatsApp}
          >
            <MessageCircle size={18} />
            Quick Order via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
