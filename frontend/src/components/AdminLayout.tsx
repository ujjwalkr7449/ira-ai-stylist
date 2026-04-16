import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, FolderTree, ArrowLeft } from "lucide-react";

const sidebarLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
];

const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r border-border shrink-0 hidden lg:block">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg font-semibold">Admin Panel</h2>
          <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">IRA Fashion</p>
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-body transition-colors ${
                  isActive
                    ? "bg-foreground text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 mt-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowLeft size={14} /> Back to Store
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex justify-around py-2">
        {sidebarLinks.map((link) => {
          const isActive = link.exact
            ? location.pathname === link.to
            : location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-body ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
