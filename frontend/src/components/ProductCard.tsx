import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { ShoppingBag, Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";

const ProductCard = ({ product }: { product: Product }) => {
  const { toggleItem, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  return (
    <div className="group block">
      <div className="relative overflow-hidden rounded-lg bg-card shadow-soft">
        <Link to={`/product/${product.id}`}>
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
        </Link>

        {/* Wishlist heart button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem(product);
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
            wishlisted
              ? "bg-red-500 text-white shadow-md scale-100"
              : "bg-background/80 backdrop-blur-sm text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} className={wishlisted ? "fill-current" : ""} />
        </button>

        {/* Quick view overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Link
            to={`/product/${product.id}`}
            className="w-full flex items-center justify-center gap-2 bg-background/90 backdrop-blur-sm text-foreground py-3 rounded-md font-body text-xs uppercase tracking-[0.15em]"
          >
            <ShoppingBag size={14} /> Quick View
          </Link>
        </div>
      </div>
      <Link to={`/product/${product.id}`}>
        <div className="mt-3 px-1">
          <p className="font-body text-xs uppercase tracking-[0.1em] text-muted-foreground">{product.category}</p>
          <h3 className="font-display text-base mt-1">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-body text-sm font-semibold">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="font-body text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
