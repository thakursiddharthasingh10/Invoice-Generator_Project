# Invoice_Generator

A modern, full-stack, responsive web application for creating professional invoices, calculating taxes and totals automatically, generating voice narrations of invoice details using the Web Speech API, managing private invoices in a secure relational database with strict user ownership, and downloading or printing pixel-perfect vector PDFs.

---

## Key Features

### 1. Secure Multi-User Authentication & Session Management
- **Registration & Login:** Clean, blue-and-white SaaS authentication portal with full name, email, password, confirm password, show/hide password controls, and strength verification.
- **Password Security:** Salted and hashed using `bcryptjs` (10 rounds). Plaintext passwords are never stored.
- **Session Persistence:** Signed JSON Web Tokens (JWT) stored securely and automatically restored across page refreshes.
- **Sign Out:** Secure session destruction with profile dropdown menu and client-side memory cleanup.

### 2. Strict User-Specific Invoice Ownership
- **Database Architecture:** Powered by **SQLite** (`better-sqlite3`) with WAL mode, foreign keys, constraints, and ACID transactions.
- **Server-Side Authorization:** Every invoice query (`list`, `get`, `create`, `update`, `duplicate`, `delete`) enforces `user_id = req.user.id`.
- **Zero Information Leakage:** If User B attempts to access User A's invoice by guessing or modifying an ID, the API returns a strict `404 Not Found`.

### 3. Professional SaaS Design & Layout
- **Design System:** Professional blue (`#2563EB`), secondary white (`#FFFFFF`), light blue-gray background (`#F5F8FD`), and dark navy text (`#14213D`).
- **Typography & Polish:** Crisp Inter font, rounded cards, subtle shadows, thin borders, and Lucide React icons.
- **Responsive Workspace:** Two-column layout on desktop (Form on the left, Live Synchronized Preview on the right). On tablets and mobile devices, an intuitive segmented toggle switches seamlessly between Form Editor, Live Preview, and Voice Narration.

### 4. Dynamic Services, Pricing & Tax Engine
- Add/remove multiple product or service line items with live subtotal, tax, and line total calculations.
- Configurable tax rate per item (0%, 5%, 12%, 18%, 28%).
- **Tax Structure Modes:**
  - Indian GST: Split into **CGST (9%) + SGST (9%)**
  - Indian **IGST (18%)**
  - Standard Single Tax %
- **Discounts & Partial Payments:**
  - Percentage-based or flat currency discounts.
  - Track amount paid and automatically compute balance due.
- **Multi-Currency Support:** Defaults to INR (`₹`), with native formatting for USD (`$`), EUR (`€`), GBP (`£`), AED, CAD, AUD, and SGD.

### 5. Voice Invoice Generator (Text-to-Speech)
- Built on the browser's native **Web Speech API** (`window.speechSynthesis` and `SpeechSynthesisUtterance`).
- **Dedicated Voice Control Panel:**
  - Play, Pause, Resume, and Stop controls.
  - Voice selection from detected browser voices.
  - Language selection: **English** and **Hindi (हिंदी)**.
  - Speech pace / speed slider (0.75x to 1.5x).
  - Status indicators: Ready, Speaking (pulse animation), Paused.
  - Live narration transcript display with a one-click **Copy Text** button.
  - Built-in number-to-words engine (e.g. `11,800` -> "eleven thousand eight hundred rupees") and spoken date formatter.

### 6. Live Invoice Preview & PDF Generation
- **Real-Time Preview:** Updates instantly as you type, matching real business invoices.
- **Vector PDF Download:** Uses `jsPDF` and `jspdf-autotable` to generate clean, high-resolution A4 vector PDFs with business details, logos, tables, and page numbering.
- **Native Print Ready:** Dedicated `@media print` stylesheet isolates and prints only the invoice sheet on A4 paper with zero clutter.

---

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  auth_provider TEXT NOT NULL DEFAULT 'local',
  business_profile TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Invoices Table
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  payment_terms TEXT NOT NULL,
  po_number TEXT,
  status TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  tax_mode TEXT NOT NULL DEFAULT 'cgst_sgst',
  business_details TEXT NOT NULL,
  client_details TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  tax_total REAL NOT NULL DEFAULT 0,
  grand_total REAL NOT NULL DEFAULT 0,
  amount_paid REAL NOT NULL DEFAULT 0,
  amount_due REAL NOT NULL DEFAULT 0,
  payment_details TEXT,
  terms_and_conditions TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  taxable_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
```

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available environment variables:
```env
PORT=5001
NODE_ENV=development
JWT_SECRET=your_secure_random_jwt_secret_key
DATABASE_PATH=./data/invoices.db
```

---

## Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Backend & Frontend Concurrently
```bash
npm run dev
```
- **Web Application:** [http://localhost:5173](http://localhost:5173)
- **API Server:** [http://localhost:5001](http://localhost:5001)

### 3. Run Automated Tests
```bash
npm test
```
Executes the Vitest test suite testing registration, login, session validity, invoice CRUD, and cross-user authorization security.

### 4. Build for Production
```bash
npm run build
```
