# Group A Logistics - Backend API

Complete backend API for Group A Logistics Management System built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with refresh tokens
- **Customer Management** - Full CRUD operations
- **Fleet Management** - Vehicle tracking and maintenance
- **Shipment Tracking** - Real-time shipment status updates
- **Order Management** - Complete order lifecycle
- **Route Planning** - Optimized delivery routes
- **Inventory Management** - Stock tracking and movements
- **Billing & Invoicing** - Invoice generation with PDF support
- **Attendance Tracking** - Employee attendance management
- **Real-time Chat** - Socket.io powered messaging
- **Analytics & Reports** - Business intelligence dashboards
- **Push Notifications** - Real-time notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## ⚙️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/groupa_logistics
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

4. **Create logs directory**
```bash
mkdir logs
```

5. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

6. **Run the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   ├── socket/          # Socket.io handlers
│   └── app.js           # Express app
├── logs/                # Log files
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json
```

## 🔐 API Endpoints

### Authentication
```
POST   /api/v1/auth/register       - Register new user
POST   /api/v1/auth/login          - Login user
POST   /api/v1/auth/logout         - Logout user
POST   /api/v1/auth/refresh-token  - Refresh access token
POST   /api/v1/auth/forgot-password - Request password reset
POST   /api/v1/auth/reset-password - Reset password
GET    /api/v1/auth/me             - Get current user
```

### Customers
```
GET    /api/v1/customers           - Get all customers
GET    /api/v1/customers/:id       - Get single customer
POST   /api/v1/customers           - Create customer
PUT    /api/v1/customers/:id       - Update customer
DELETE /api/v1/customers/:id       - Delete customer
GET    /api/v1/customers/search    - Search customers
```

### Fleet (Vehicles)
```
GET    /api/v1/fleet               - Get all vehicles
GET    /api/v1/fleet/:id           - Get vehicle details
POST   /api/v1/fleet               - Add new vehicle
PUT    /api/v1/fleet/:id           - Update vehicle
DELETE /api/v1/fleet/:id           - Delete vehicle
```

### Shipments
```
GET    /api/v1/shipments           - Get all shipments
GET    /api/v1/shipments/:id       - Get shipment details
POST   /api/v1/shipments           - Create shipment
PUT    /api/v1/shipments/:id       - Update shipment
PATCH  /api/v1/shipments/:id/status - Update status
GET    /api/v1/shipments/track/:trackingNumber - Track shipment
```

### Orders
```
GET    /api/v1/orders              - Get all orders
GET    /api/v1/orders/:id          - Get order details
POST   /api/v1/orders              - Create order
PUT    /api/v1/orders/:id          - Update order
PATCH  /api/v1/orders/:id/status   - Update order status
```

### Inventory
```
GET    /api/v1/inventory           - Get all items
GET    /api/v1/inventory/:id       - Get item details
POST   /api/v1/inventory           - Add new item
PUT    /api/v1/inventory/:id       - Update item
POST   /api/v1/inventory/stock-movement - Record stock movement
```

### Billing
```
GET    /api/v1/billing/invoices    - Get all invoices
GET    /api/v1/billing/invoices/:id - Get invoice details
POST   /api/v1/billing/invoices    - Create invoice
GET    /api/v1/billing/invoices/:id/pdf - Download invoice PDF
```

## 🔒 Authentication

All protected routes require Bearer token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Example Login Request
```javascript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Example Response
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔌 Socket.io Events

### Client → Server
- `join_conversation` - Join a chat conversation
- `send_message` - Send a message
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `mark_read` - Mark messages as read

### Server → Client
- `new_message` - New message received
- `message_sent` - Message delivery confirmation
- `user_typing` - User typing indicator
- `user_stop_typing` - User stopped typing
- `messages_read` - Messages marked as read
- `user_status_changed` - User online/offline status

## 📊 Database Models

- **User** - System users (admin, manager, driver, staff)
- **Customer** - Customer information
- **Vehicle** - Fleet vehicles
- **Shipment** - Shipment tracking
- **Order** - Customer orders
- **Route** - Delivery routes
- **Inventory** - Inventory items
- **StockMovement** - Stock transactions
- **Invoice** - Billing invoices
- **Attendance** - Employee attendance
- **Chat** - Chat messages
- **Conversation** - Chat conversations
- **Notification** - User notifications

## 🛠️ Technologies

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Multer** - File uploads
- **PDFKit** - PDF generation
- **Nodemailer** - Email sending

## 🔧 Configuration

### MongoDB Indexes
The application automatically creates indexes for optimal query performance. Manual index creation:

```javascript
// In MongoDB shell
db.customers.createIndex({ name: "text", email: "text" })
db.vehicles.createIndex({ "currentLocation": "2dsphere" })
db.shipments.createIndex({ trackingNumber: 1 })
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 5000) |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT secret key | Yes |
| JWT_REFRESH_SECRET | Refresh token secret | Yes |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | No |
| EMAIL_HOST | SMTP host | No |
| TWILIO_ACCOUNT_SID | Twilio account SID | No |

## 🚀 Deployment

### Heroku
```bash
heroku create your-app-name
heroku addons:create mongolab
git push heroku main
```

### Docker
```bash
docker build -t groupa-logistics-backend .
docker run -p 5000:5000 --env-file .env groupa-logistics-backend
```

## 📝 API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message",
  "errors": [ ]
}
```

### Paginated Response
```json
{
  "status": "success",
  "message": "Data retrieved",
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@groupalogistics.com or join our Slack channel.

## 🔄 Version

Current Version: 1.0.0

---

Built with ❤️ for Group A Logistics