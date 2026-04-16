import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground mt-20">
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-display text-2xl font-bold mb-4">IRA</h3>
          <p className="text-sm opacity-70 leading-relaxed">Wear Your Intelligence. Premium fashion powered by AI-driven style.</p>
        </div>
        <div>
          <h4 className="font-body text-xs uppercase tracking-[0.15em] mb-4 opacity-50">Shop</h4>
          <div className="space-y-2 text-sm opacity-70">
            <Link to="/shop?category=men" className="block hover:opacity-100 transition-opacity">Men</Link>
            <Link to="/shop?category=women" className="block hover:opacity-100 transition-opacity">Women</Link>
            <Link to="/shop?category=streetwear" className="block hover:opacity-100 transition-opacity">Streetwear</Link>
            <Link to="/shop?category=formal" className="block hover:opacity-100 transition-opacity">Formal</Link>
          </div>
        </div>
        <div>
          <h4 className="font-body text-xs uppercase tracking-[0.15em] mb-4 opacity-50">Company</h4>
          <div className="space-y-2 text-sm opacity-70">
            <p className="hover:opacity-100 transition-opacity cursor-pointer">About Us</p>
            <p className="hover:opacity-100 transition-opacity cursor-pointer">Sustainability</p>
            <p className="hover:opacity-100 transition-opacity cursor-pointer">Careers</p>
          </div>
        </div>
        <div>
          <h4 className="font-body text-xs uppercase tracking-[0.15em] mb-4 opacity-50">Support</h4>
          <div className="space-y-2 text-sm opacity-70">
            <p className="hover:opacity-100 transition-opacity cursor-pointer">Contact</p>
            <p className="hover:opacity-100 transition-opacity cursor-pointer">Shipping & Returns</p>
            <p className="hover:opacity-100 transition-opacity cursor-pointer">Size Guide</p>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-xs opacity-40">
        © 2026 IRA Clothing. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
