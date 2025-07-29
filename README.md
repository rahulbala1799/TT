# PrintTrack - Order Management System

A professional order tracking and management system designed for printing companies, built with Next.js 13.x and deployed on Railway.

## Features

- 🔐 **User Authentication** - Secure login system with role-based access
- 📋 **Order Management** - Track orders from design to delivery
- 👥 **Customer Management** - Maintain customer information and history
- 📊 **Dashboard** - Real-time overview of orders and status
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🚀 **Railway Deployment** - Optimized for Railway platform

## Tech Stack

- **Frontend**: Next.js 13.x, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Railway)
- **Authentication**: NextAuth.js
- **ORM**: Prisma
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18.x
- npm 9.x
- PostgreSQL database (Railway provides this)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pcal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/printing_orders"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Railway Deployment

### 1. Connect to Railway

1. Fork this repository to your GitHub account
2. Sign up for [Railway](https://railway.app)
3. Create a new project and connect your GitHub repository

### 2. Add PostgreSQL Database

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provide the `DATABASE_URL`

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:

```env
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=${{RAILWAY_STATIC_URL}}
NODE_ENV=production
```

### 4. Deploy

Railway will automatically deploy when you push to your main branch.

## Database Schema

The application includes the following main models:

- **User** - System users with role-based access
- **Customer** - Client information
- **Order** - Printing orders with status tracking
- **OrderItem** - Individual items within orders
- **OrderStatusLog** - Order status change history

### Order Statuses

- `PENDING` - Order received, awaiting processing
- `IN_DESIGN` - Design phase
- `IN_PRODUCTION` - Currently being printed
- `QUALITY_CHECK` - Quality assurance
- `READY_FOR_DELIVERY` - Ready for pickup/delivery
- `DELIVERED` - Order completed
- `CANCELLED` - Order cancelled

### User Roles

- `ADMIN` - Full system access
- `MANAGER` - Order and customer management
- `USER` - Basic order viewing

## Project Structure

```
src/
├── app/                    # Next.js 13 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── orders/            # Order management
│   └── customers/         # Customer management
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions

prisma/
└── schema.prisma          # Database schema

```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

---

Built with ❤️ for printing companies 