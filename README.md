# IRA AI Stylist

Welcome to **IRA AI Stylist**, an intelligent, AI-powered fashion styling and e-commerce platform. IRA acts as your personal AI fashion assistant, offering personalized style recommendations, seamless shopping experiences, and advanced store management.

## 🌟 Project Overview

IRA AI Stylist combines a modern, responsive frontend with a powerful, AI-driven backend to revolutionize online fashion retail. It integrates advanced Large Language Models (via Groq and Hugging Face) to power conversational styling, personalized product curation, and automated fashion advice.

### Key Features
- **AI-Powered Fashion Chat**: Chat with IRA, the AI stylist, for personalized outfit recommendations and fashion advice.
- **Full E-Commerce Capabilities**: Browse products, manage categories, add to cart, maintain a wishlist, and handle secure checkout.
- **Admin Dashboard**: Comprehensive admin tools for managing orders, users, products, and platform metrics.
- **Responsive UI/UX**: A beautiful, modern interface built with React, Vite, and Tailwind CSS.
- **Secure Authentication**: Robust user authentication and authorization system.
- **Image Uploads**: Seamless handling of product and user image uploads.

---

## 🛠️ Architecture & Tech Stack

The project is structured as a modern full-stack application, cleanly separated into a RESTful API backend and a Single Page Application (SPA) frontend.

### Backend (Python)
- **Framework**: FastAPI for high-performance, asynchronous REST APIs.
- **Database**: SQLAlchemy ORM with SQLite (dev) / PostgreSQL (production).
- **AI Integrations**: Groq and Hugging Face for rapid, intelligent LLM inferences.
- **Data Validation**: Pydantic models for strict type checking and API schemas.
- **Authentication**: JWT-based auth via `python-jose` and `passlib`.

### Frontend (TypeScript)
- **Framework**: React 18 with Vite for blazing-fast development and optimized builds.
- **Styling**: Tailwind CSS combined with `shadcn/ui` (Radix UI) for accessible, beautiful components.
- **State Management**: React Query (`@tanstack/react-query`) for efficient server state and caching.
- **Routing**: React Router DOM for seamless navigation.

---

## 🚀 Local Setup Instructions

Follow these steps to get the project running on your local machine.

### Prerequisites
- Node.js (v18 or higher)
- Python (3.9 or higher)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/ujjwalkr7449/ira-ai-stylist.git
cd ira-ai-stylist
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   Create a `.env` file in the `backend` directory. Add the required API keys (e.g., Groq API key, Twilio credentials, DB URL).
5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The API will be available at `http://localhost:8000` and Swagger docs at `http://localhost:8000/docs`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (using npm, yarn, or bun):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:5173`.*

---

## 🧠 Why Groq & Hugging Face?
We chose **Groq** for its blazing-fast inference speeds, which is critical for maintaining a seamless, real-time conversational experience with the AI stylist. The low latency ensures users get immediate fashion advice without frustrating loading times. **Hugging Face** is utilized for specialized models, potentially including image generation and complex multimodal tasks required by a visual domain like fashion.

## 🔮 Future Improvements
- **Visual Try-On**: Integrate generative AI to allow users to visualize outfits on themselves.
- **Social Styling**: Allow users to share generated outfits and vote on looks.
- **Advanced Demand Forecasting**: Utilize machine learning to predict trending styles and automate inventory management.
- **Multilingual Support**: Expand the AI chat capabilities to support diverse languages.

---

*For support, open an issue or contact the development team.*
