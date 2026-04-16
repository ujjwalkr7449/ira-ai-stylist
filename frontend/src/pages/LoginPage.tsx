import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const LoginPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Already logged in
  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-3">Welcome, {user.name}!</h1>
          <p className="font-body text-muted-foreground mb-4">You are logged in as {user.email}</p>
          {user.role === "admin" && (
            <Link to="/admin"><Button variant="hero" size="lg" className="mb-3">Go to Admin Panel</Button></Link>
          )}
          <br />
          <Link to="/shop"><Button variant="outline" size="lg">Continue Shopping</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isSignup) {
        if (!name) { toast.error("Please enter your name"); setLoading(false); return; }
        await register(email, password, name, phone);
        toast.success("Account created!");
      } else {
        await login(email, password);
        toast.success("Welcome back!");
      }
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "Authentication failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        {/* Glassmorphism card */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-primary/10 rounded-2xl blur-xl" />
        <div className="relative glass rounded-2xl p-8 md:p-10 bg-card/80 backdrop-blur-xl border border-border/50 shadow-hover">
          <div className="text-center mb-8">
            <Link to="/" className="font-display text-3xl font-bold">IRA</Link>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {isSignup ? "Create your account" : "Welcome back"}
            </p>
          </div>

          <div className="space-y-4">
            {isSignup && (
              <>
                <input placeholder="Full Name *" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground" />
                <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground" />
              </>
            )}
            <input placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground" />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground pr-10" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button variant="hero" size="lg" className="w-full py-5" onClick={handleSubmit} disabled={loading}>
              {loading ? "Please wait..." : (isSignup ? "Create Account" : "Sign In")}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="font-body text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <button onClick={() => setIsSignup(!isSignup)} className="text-gold ml-1 hover:underline">
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
