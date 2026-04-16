import { Link } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Search, Heart, Shield, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/shop", label: "Shop All" },
    { to: "/shop?category=men", label: "Men" },
    { to: "/shop?category=women", label: "Women" },
    { to: "/shop?category=streetwear", label: "Streetwear" },
    { to: "/shop?category=formal", label: "Formal" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="font-display text-2xl font-bold tracking-wider">IRA</Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/shop" className="text-foreground hover:text-gold transition-colors"><Search size={20} /></Link>
          <Link to="/wishlist" className="relative text-foreground hover:text-gold transition-colors" aria-label="Wishlist">
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-foreground hover:text-gold transition-colors" title="Admin Panel">
              <Shield size={20} />
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-foreground hover:text-gold transition-colors hidden sm:block" title={user.name}>
                <span className="font-body text-xs">{user.name.split(" ")[0]}</span>
              </Link>
              <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-foreground hover:text-gold transition-colors"><User size={20} /></Link>
          )}
          <Link to="/cart" className="relative text-foreground hover:text-gold transition-colors">
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gold text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-background border-t border-border px-4 py-4 space-y-3 animate-fade-in">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block font-body text-sm uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="block font-body text-sm uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">
            Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
          </Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block font-body text-sm uppercase tracking-[0.1em] text-gold hover:text-foreground">
              Admin Panel
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
