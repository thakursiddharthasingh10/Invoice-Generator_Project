# Invoice_Generator

A modern, responsive web application for creating professional invoices, calculating taxes and totals automatically, generating voice narrations of invoice details using the Web Speech API, managing invoices in local storage, and downloading or printing pixel-perfect PDFs.

---

## Key Features

### 1. Professional SaaS Design & Layout
- **Design System:** Professional blue (`#2563EB`), secondary white (`#FFFFFF`), light blue-gray background (`#F5F8FD`), and dark navy text (`#14213D`).
- **Typography & Polish:** Crisp Inter font, rounded cards, subtle shadows, thin borders, and Lucide React icons.
- **Responsive Workspace:** Two-column layout on desktop (Form on the left, Live Synchronized Preview on the right). On tablets and mobile devices, an intuitive segmented toggle switches seamlessly between Form Editor, Live Preview, and Voice Narration.

### 2. Dynamic Services, Pricing & Tax Engine
- Add/remove multiple product or service line items with live subtotal, tax, and line total calculations.
- Configurable tax rate per item (0%, 5%, 12%, 18%, 28%).
- **Tax Structure Modes:**
  - Indian GST: Split into **CGST (9%) + SGST (9%)**
  - Indian **IGST (18%)**
  - Standard Single Tax %
- **Discounts & Partial Payments:**
  - Percentage-based or flat currency discounts.
  - Track amount paid and automatically compute balance due.
- **Multiple Currencies:** Defaults to INR (`₹`), with support for USD (`$`), EUR (`€`), GBP (`£`), AED, CAD, AUD, and SGD.

### 3. Voice Invoice Generator (Text-to-Speech)
- Built on the browser's native **Web Speech API** (`window.speechSynthesis` and `SpeechSynthesisUtterance`).
- **Dedicated Voice Control Panel:**
  - Play, Pause, Resume, and Stop controls.
  - Voice selection from detected browser voices.
  - Language selection: **English** and **Hindi (हिंदी)**.
  - Speech pace / speed slider (0.75x to 1.5x).
  - Status indicators: Ready, Speaking (pulse animation), Paused.
  - Live narration transcript display with a one-click **Copy Text** button.
  - Built-in number-to-words engine (e.g. `11,800` -> "eleven thousand eight hundred rupees") and spoken date formatter.

### 4. Live Invoice Preview & PDF Generation
- **Real-Time Preview:** Updates instantly as you type, matching real business invoices.
- **Vector PDF Download:** Uses `jsPDF` and `jspdf-autotable` to generate clean, high-resolution A4 vector PDFs with business details, logos, tables, and page numbering.
- **Native Print Ready:** Dedicated `@media print` stylesheet isolates and prints only the invoice sheet on A4 paper with zero clutter.

### 5. Invoice Management & Persistence
- Persistent storage via browser `localStorage`.
- Search invoices by invoice number, client name, or business name.
- Filter by status (**All**, **Draft**, **Pending**, **Paid**, **Overdue**).
- Sort by date (newest/oldest) or amount (highest/lowest).
- Toggle between **Table View** and **Grid / Card View**.
- Duplicate existing invoices with automatic next sequential numbering.
- Delete invoices with confirmation dialogs.
- "Save as Default Business Profile" option to auto-fill future invoices.

---

## Project Structure

```
Invoice_Generator/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── invoice.ts
│   ├── utils/
│   │   ├── currencyFormatter.ts
│   │   ├── invoiceCalculations.ts
│   │   ├── invoiceNarration.ts
│   │   ├── invoiceNumberGenerator.ts
│   │   ├── invoiceStorage.ts
│   │   ├── invoiceValidation.ts
│   │   └── pdfExport.ts
│   └── components/
│       ├── Navbar.tsx
│       ├── Dashboard.tsx
│       ├── InvoicePreview.tsx
│       ├── VoiceGenerator.tsx
│       ├── SavedInvoices.tsx
│       ├── ConfirmModal.tsx
│       ├── Toast.tsx
│       └── InvoiceForm/
│           ├── InvoiceForm.tsx
│           ├── BusinessDetailsForm.tsx
│           ├── ClientDetailsForm.tsx
│           ├── InvoiceMetaForm.tsx
│           ├── InvoiceItemsTable.tsx
│           └── InvoiceSummaryForm.tsx
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```
Preview the production build:
```bash
npm run preview
```
