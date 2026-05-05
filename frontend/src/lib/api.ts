const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("ira-token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ─── Auth ────────────────────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<AuthUser>("/auth/me"),
};

// ─── Products ────────────────────────────────────
export interface ProductColor {
  name: string;
  hex: string;
}

export interface ApiProduct {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[];
  category_id: number | null;
  category_name: string | null;
  sizes: string[];
  colors: ProductColor[];
  description: string;
  rating: number;
  reviews: number;
  tags: string[];
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductCreate {
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string;
  images?: string[];
  category_id?: number | null;
  sizes?: string[];
  colors?: ProductColor[];
  description?: string;
  tags?: string[];
  stock?: number;
}

export const productApi = {
  list: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return request<ApiProduct[]>(`/products${query ? `?${query}` : ""}`);
  },

  listAll: () => request<ApiProduct[]>("/products/all"),

  get: (id: number) => request<ApiProduct>(`/products/${id}`),

  create: (data: ProductCreate) =>
    request<ApiProduct>("/products", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<ProductCreate> & { is_active?: boolean }) =>
    request<ApiProduct>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<{ ok: boolean }>(`/products/${id}`, { method: "DELETE" }),
};

// ─── Categories ──────────────────────────────────
export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  image_url: string;
}

export const categoryApi = {
  list: () => request<ApiCategory[]>("/categories"),

  create: (data: { name: string; slug: string; image_url?: string }) =>
    request<ApiCategory>("/categories", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<{ name: string; slug: string; image_url: string }>) =>
    request<ApiCategory>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" }),
};

// ─── Orders ──────────────────────────────────────
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface ApiOrder {
  id: number;
  user_id: number | null;
  status: string;
  total: number;
  shipping_address: Record<string, string>;
  customer_name: string;
  customer_phone: string;
  whatsapp_sent: boolean;
  items: OrderItem[];
  created_at: string;
}

export interface OrderCreateData {
  items: {
    product_id: number;
    product_name: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }[];
  shipping_address: Record<string, string>;
  customer_name: string;
  customer_phone: string;
  total: number;
  whatsapp_sent: boolean;
}

export interface AdminStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  pending_orders: number;
}

export const orderApi = {
  create: (data: OrderCreateData) =>
    request<ApiOrder>("/orders", { method: "POST", body: JSON.stringify(data) }),

  myOrders: () => request<ApiOrder[]>("/orders"),

  adminAll: () => request<ApiOrder[]>("/orders/admin/all"),

  updateStatus: (id: number, status: string) =>
    request<ApiOrder>(`/orders/admin/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  stats: () => request<AdminStats>("/orders/admin/stats"),
};

// ─── Wishlist ────────────────────────────────────
export const wishlistApi = {
  get: () => request<number[]>("/wishlist"),

  toggle: (productId: number) =>
    request<{ ok: boolean; action: string }>("/wishlist/toggle", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    }),

  remove: (productId: number) =>
    request<{ ok: boolean }>(`/wishlist/${productId}`, { method: "DELETE" }),
};

// ─── Chat ────────────────────────────────────────
export interface ChatMessage {
  role: string;
  content: string;
}

export const chatApi = {
  send: (messages: ChatMessage[]) =>
    request<{ reply: string; image_url?: string; product_id?: number; product_name?: string }>("/chat", { method: "POST", body: JSON.stringify({ messages }) }),
};

// ─── Uploads ─────────────────────────────────────
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string }>("/upload", { method: "POST", body: formData });
  },
};
