import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const WishlistPage = () => {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();

  const handleAddToCart = (product: typeof items[0]) => {
    const defaultSize = product.sizes[0] || "M";
    const defaultColor = product.colors[0]?.name || "Default";
    addItem(product, defaultSize, defaultColor);
    toast.success(`${product.name} added to cart`, {
      description: `Size: ${defaultSize} · Color: ${defaultColor}`,
    });
  };

  if (items.length === 0) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Heart size={48} className="mx-auto text-muted-foreground mb-6" />
      <h1 className="font-display text-3xl font-semibold mb-3">Your Wishlist is Empty</h1>
      <p className="font-body text-muted-foreground mb-8">Save items you love for later.</p>
      <Link to="/shop"><Button variant="hero" size="lg" className="px-10">Explore Shop</Button></Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">My Wishlist</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearWishlist} className="text-xs">
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <div key={product.id} className="bg-card rounded-xl overflow-hidden shadow-soft group">
            <Link to={`/product/${product.id}`} className="block">
              <div className="aspect-[3/4] overflow-hidden relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
              </div>
            </Link>
            <div className="p-4 space-y-3">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.1em] text-muted-foreground">{product.category}</p>
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-display text-base mt-1 hover:text-gold transition-colors">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-body text-sm font-semibold">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="font-body text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1 text-[10px]"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingBag size={14} /> Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9 text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => removeItem(product.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/shop" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default WishlistPage;
