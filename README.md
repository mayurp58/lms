# Banking System - Loan Management Platform

A comprehensive Next.js-based loan management system with role-based access control for managing loan applications, document verification, disbursements, and post-disbursement operations.

## Features

- **Role-Based Access Control**: Super Admin, Admin, Operator, Banker, and Connector roles
- **Loan Application Management**: Complete application lifecycle from submission to disbursement
- **Document Verification**: Upload, verify, and manage customer documents
- **Bank Marketplace**: Distribute applications to multiple banks and receive offers
- **Disbursement Tracking**: Manage loan disbursements and commission payments
- **Post-Disbursement Operations**: Handle vehicle registration and insurance documents (PDD)
- **RTO Agent Management**: Assign and track RTO agents for auto loans
- **Commission Management**: Calculate and track connector commissions

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: Custom JWT-based authentication
- **File Storage**: Local file system

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd banking-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=gcfinance

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=10

# Application Configuration
NODE_ENV=development
```

**Important**: Replace `your_password` and `JWT_SECRET` with secure values.

### 4. Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE gcfinance;
EXIT;
```

### 5. Initialize Database and Directories

Run the setup script to create tables and directories:

```bash
npm run setup
```

This command will:
- Create all database tables and initial data
- Set up upload directories (`public/uploads/documents`, etc.)
- Create a default super admin user

**Default Admin Credentials**:
- Email: `admin@gcfinance.com`
- Password: `admin123`

⚠️ **Change the default password immediately after first login!**

## Manual Setup (Alternative)

If you prefer to run setup steps individually:

```bash
# 1. Create upload directories
npm run setup-dirs

# 2. Initialize database
npm run init-db
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at [http://localhost:3002](http://localhost:3002)

### Production Mode

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

## Project Structure

```
banking-system/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin portal
│   │   ├── operator/          # Operator portal
│   │   ├── banker/            # Banker portal
│   │   ├── connector/         # Connector portal
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   └── layout/           # Layout components
│   └── lib/                   # Utilities and libraries
│       ├── auth/             # Authentication logic
│       ├── db/               # Database connection and schemas
│       └── utils.js          # Helper functions
├── scripts/                   # Setup scripts
├── public/                    # Static files
│   └── uploads/              # File uploads directory
└── package.json
```

## User Roles

### 1. Super Admin
- Full system access
- User management
- System configuration
- All admin capabilities

### 2. Admin
- Application management
- Disbursement processing
- Commission management
- Reports and analytics
- Post-disbursement operations

### 3. Operator
- Document verification
- Application status updates
- Customer management
- Post-disbursement operations

### 4. Banker
- View assigned applications
- Submit loan offers
- Process approvals

### 5. Connector
- Create loan applications
- Upload customer documents
- Track commissions
- View application status

## Key Features Guide

### Post-Disbursement Operations (PDD)

For auto loans, after disbursement:
1. Navigate to **Post Disbursement** from admin/operator portal
2. Assign RTO agents to cases
3. Upload required documents:
   - RC Copy / RC Smart Card
   - Insurance Policy
   - RTO Receipt
   - Loan Closure Letter
4. Track RC status and completion

### Document Management

Admins can configure document types:
1. Go to **Documents** → **Add New Document**
2. Set document name and requirements
3. Mark as **PDD Document** if it's for post-disbursement
4. Configure validation rules

### Bank Marketplace

1. Operators verify applications and send to banks
2. Bankers review and submit offers
3. Admins/Operators compare offers and select the best one
4. Selected offer becomes the approved loan

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 3002) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run init-db` | Initialize database tables |
| `npm run setup-dirs` | Create upload directories |
| `npm run setup` | Run full setup (dirs + db) |

## Database Schema

Key tables:
- `users` & `user_profiles` - User authentication and profiles
- `customers` - Customer information
- `loan_applications` - Loan applications
- `customer_documents` - Uploaded documents
- `document_types` - Document type definitions
- `banks` & `bankers` - Bank and banker information
- `loan_offers` - Bank loan offers
- `loan_disbursements` - Disbursement records
- `post_disbursement_cases` - PDD tracking
- `rto_agents` - RTO agent registry
- `commission_records` - Commission tracking

## Security

- JWT-based authentication with HTTP-only cookies
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Troubleshooting

### Port Already in Use

If port 3002 is already in use:

```bash
# Kill the process using the port
lsof -ti:3002 | xargs kill -9

# Or change the port in package.json
"dev": "PORT=3003 next dev"
```

### Database Connection Error

- Verify MySQL is running: `mysql.server status`
- Check `.env.local` credentials
- Ensure database exists: `SHOW DATABASES;`

### File Upload Issues

- Verify upload directories exist: `ls -la public/uploads`
- Run: `npm run setup-dirs`
- Check folder permissions

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact the development team.
