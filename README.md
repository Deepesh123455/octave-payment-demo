# Octave Payment Portal

A secure, high-performance financial management and approval portal for Octave Apparels. This application simplifies store-level expense approvals (Rent, Utility, Petty Cash) and enables seamless bulk payments via Razorpay.

## 🚀 Features

-   **Approval Center**: Centralized dashboard for managing approved expense items.
-   **Bulk Payments**: Select multiple items across different categories and pay for them in a single Razorpay transaction.
-   **Role-Based Access**: 
    -   `SUPER_ADMIN` & `FINANCE_ADMIN`: Can approve, reject, and initiate payments.
    -   `EXPENSE_VIEWER`: Read-only access to approved lists.
-   **Multi-Module Support**: Handles Rent Payments, Utility Bills, and Petty Cash requests.
-   **Razorpay Integration**: Native integration for secure payment initiation and confirmation.
-   **Responsive Design**: Modern, premium UI built with Shadcn UI and Framer Motion.

## 🛠️ Tech Stack

### Frontend
-   **React 18** (Vite)
-   **Tailwind CSS**
-   **Shadcn UI**
-   **Framer Motion** (Micro-animations)
-   **React Query** (Server state management)

### Backend
-   **Node.js / Express**
-   **Prisma ORM** (PostgreSQL)
-   **Redis** (Rate limiting & BullMQ)
-   **TypeScript**

## 📦 Project Structure

```bash
├── octave-backend/       # Node.js Express API
└── octave-finance-hub/   # React Vite Frontend
```

## ⚙️ Getting Started

### Prerequisites
-   Node.js (>=20)
-   PostgreSQL
-   Redis

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/octave-payment-portal.git
    cd octave-payment-portal
    ```

2.  **Setup Backend**:
    ```bash
    cd octave-backend
    npm install
    # Create .env based on .env.example
    npx prisma generate
    npm run dev
    ```

3.  **Setup Frontend**:
    ```bash
    cd ../octave-finance-hub
    npm install
    # Create .env based on .env.example
    npm run dev
    ```

## 🌐 Deployment

This project is optimized for deployment on **Render** (Backend) and **Vercel** (Frontend).

### Backend (Render)
-   The project includes a `render.yaml` for Render Blueprints.
-   Connect your repo to Render and choose the `octave-backend` root.

### Frontend (Vercel)
-   Deploy the `octave-finance-hub` directory as a standard Vite application.
-   Ensure `VITE_API_BASE_URL` is set to your Render backend URL.

## 📄 License
Internal proprietary license for Octave Apparels.
