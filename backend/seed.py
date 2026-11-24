"""
Seed script -- run once to populate initial data.
Usage: python seed.py
"""
import os
import sys

# Fix Windows console encoding
if sys.platform == "win32":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from database import engine, SessionLocal, Base
from models import User, Category, Product
from auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# --- Admin User ---
admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
admin_password = os.getenv("ADMIN_PASSWORD", "")
if not admin_email or not admin_password:
    db.close()
    raise RuntimeError("Set ADMIN_EMAIL and ADMIN_PASSWORD before running seed.py")

if not db.query(User).filter(User.email == admin_email).first():
    admin = User(
        email=admin_email,
        password_hash=hash_password(admin_password),
        name="IRA Admin",
        phone="7979760802",
        role="admin",
    )
    db.add(admin)
    print(f"[+] Admin user created: {admin_email}")
else:
    print("[i] Admin already exists")

# --- Categories ---
categories_data = [
    {"name": "Men", "slug": "men", "image_url": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80&auto=format"},
    {"name": "Women", "slug": "women", "image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&auto=format"},
    {"name": "Streetwear", "slug": "streetwear", "image_url": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&q=80&auto=format"},
    {"name": "Formal", "slug": "formal", "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format"},
]

cat_map = {}
for cd in categories_data:
    cat = db.query(Category).filter(Category.slug == cd["slug"]).first()
    if not cat:
        cat = Category(**cd)
        db.add(cat)
        db.flush()
        print(f"[+] Category: {cd['name']}")
    else:
        print(f"[i] Category '{cd['name']}' already exists")
    cat_map[cd["slug"]] = cat.id

# --- Products ---
products_data = [
    {
        "name": "Oversized Linen Blazer", "price": 8999, "original_price": 12999,
        "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80"],
        "category_id": cat_map.get("formal"),
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Sand", "hex": "#C2B280"}, {"name": "Charcoal", "hex": "#36454F"}],
        "description": "A relaxed-fit linen blazer crafted for effortless sophistication. Perfect for warm-weather occasions.",
        "rating": 4.5, "reviews": 128, "tags": ["blazer", "linen", "oversized"],
    },
    {
        "name": "Structured Knit Polo", "price": 3499,
        "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80"],
        "category_id": cat_map.get("men"),
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "Ivory", "hex": "#FFFFF0"}, {"name": "Navy", "hex": "#000080"}],
        "description": "Premium knit polo with a structured collar. Versatile enough for office or weekend.",
        "rating": 4.7, "reviews": 256, "tags": ["polo", "knit"],
    },
    {
        "name": "Silk Midi Dress", "price": 12499, "original_price": 16999,
        "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80"],
        "category_id": cat_map.get("women"),
        "sizes": ["XS", "S", "M", "L"],
        "colors": [{"name": "Emerald", "hex": "#50C878"}, {"name": "Black", "hex": "#000000"}],
        "description": "Flowing silk midi dress with a flattering drape. Ideal for evening events.",
        "rating": 4.8, "reviews": 89, "tags": ["dress", "silk", "midi"],
    },
    {
        "name": "Urban Cargo Joggers", "price": 4999,
        "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80"],
        "category_id": cat_map.get("streetwear"),
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Olive", "hex": "#808000"}, {"name": "Black", "hex": "#000000"}],
        "description": "Technical cargo joggers with articulated knees and multiple utility pockets.",
        "rating": 4.3, "reviews": 312, "tags": ["joggers", "cargo", "streetwear"],
    },
    {
        "name": "Cashmere Crewneck", "price": 7999,
        "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cda3a00?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1434389677669-e08b4cda3a00?w=800&q=80"],
        "category_id": cat_map.get("men"),
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Camel", "hex": "#C19A6B"}, {"name": "Grey", "hex": "#808080"}],
        "description": "Luxurious 100% cashmere crewneck sweater. Incredibly soft with a refined finish.",
        "rating": 4.9, "reviews": 67, "tags": ["cashmere", "sweater"],
    },
    {
        "name": "Graphic Oversized Tee", "price": 2499,
        "image_url": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80"],
        "category_id": cat_map.get("streetwear"),
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "White", "hex": "#FFFFFF"}, {"name": "Black", "hex": "#000000"}],
        "description": "Statement graphic tee in premium heavyweight cotton. Oversized drop-shoulder fit.",
        "rating": 4.4, "reviews": 445, "tags": ["tee", "graphic", "oversized"],
    },
    {
        "name": "Tailored Wool Trousers", "price": 6499,
        "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80"],
        "category_id": cat_map.get("formal"),
        "sizes": ["28", "30", "32", "34", "36"],
        "colors": [{"name": "Charcoal", "hex": "#36454F"}, {"name": "Navy", "hex": "#000080"}],
        "description": "Impeccably tailored wool trousers with a modern straight-leg silhouette.",
        "rating": 4.6, "reviews": 93, "tags": ["trousers", "wool", "tailored"],
    },
    {
        "name": "Satin Wrap Blouse", "price": 4499,
        "image_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=80&auto=format",
        "images": ["https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80"],
        "category_id": cat_map.get("women"),
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colors": [{"name": "Champagne", "hex": "#F7E7CE"}, {"name": "Rose", "hex": "#FF007F"}],
        "description": "Elegant satin wrap blouse with a draped neckline. Transitions seamlessly from day to night.",
        "rating": 4.5, "reviews": 178, "tags": ["blouse", "satin", "wrap"],
    },
]

for pd in products_data:
    if not db.query(Product).filter(Product.name == pd["name"]).first():
        product = Product(**pd)
        db.add(product)
        print(f"[+] Product: {pd['name']}")
    else:
        print(f"[i] Product '{pd['name']}' already exists")

db.commit()
db.close()
print("\nSeed complete!")
