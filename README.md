# 💬 Modern Chat Application

A full-stack real-time chat application built with React, Node.js, Express, MongoDB, and Socket.IO. The application features a modern, professional design with a beautiful color palette and comprehensive chat functionality.

![Chat App Preview](https://img.shields.io/badge/React-19.2.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen.svg)
![Socket.IO](https://img.shields.io/badge/Real--time-Socket.IO-yellow.svg)

## ✨ Features

### 🔐 Authentication & User Management
- **User Registration & Login** - Secure authentication with JWT tokens
- **Quick Access Login** - Streamlined login process with automatic account creation
- **Password Visibility Toggle** - Eye button to show/hide passwords
- **Session Management** - Persistent login sessions with token storage

### 👥 Contact Management
- **User Discovery** - Browse and discover all registered users
- **Contact Requests** - Send, receive, accept, and reject contact requests
- **Contact List** - Manage your trusted connections
- **Online Status** - Real-time online/offline indicators
- **Contact Search** - Find users by name or email

### 💬 Real-time Messaging
- **One-on-One Chat** - Private conversations between users
- **Group Chat** - Create and participate in group conversations
- **Real-time Delivery** - Instant message delivery with Socket.IO
- **Message Status** - Sending indicators and timestamps
- **Chat History** - Persistent message storage and retrieval
- **Auto-scroll** - Automatic scrolling to latest messages

### 🎯 Group Features
- **Group Creation** - Create groups with selected contacts
- **Group Management** - Admin controls and member management
- **Group Discovery** - Browse and join available groups
- **Member Count** - Display active group member counts
- **Group Chat** - Multi-user conversations with real-time updates

### 🎨 Modern UI/UX
- **Professional Design** - Beautiful color palette with gradient themes
- **Responsive Layout** - Mobile-first design that works on all devices
- **Smooth Animations** - Fade-in, slide-in, and hover effects
- **Intuitive Navigation** - Easy-to-use interface with clear navigation
- **Card-based Layout** - Modern card design for all components
- **Custom Styling** - Professional color scheme with CSS variables

## 🚀 Technology Stack

### Frontend
- **React 19.2.0** - Modern React with hooks and functional components
- **Redux Toolkit** - State management for contacts and user data
- **React Router DOM** - Client-side routing and navigation
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client for API requests
- **CSS3** - Custom styling with CSS variables and modern features

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - MongoDB object modeling for Node.js
- **Socket.IO** - Real-time bidirectional event-based communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing and security
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
Chat_app/
├── client/                 # React frontend application
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api.js          # API client configuration
│   │   ├── App.js          # Main application component
│   │   ├── App.css         # Global styles and animations
│   │   ├── index.css       # Core styling with CSS variables
│   │   ├── socket.js       # Socket.IO client configuration
│   │   ├── app/
│   │   │   └── store.js    # Redux store configuration
│   │   ├── features/
│   │   │   └── contacts/
│   │   │       └── contactsSlice.js  # Redux slice for contacts
│   │   └── pages/
│   │       ├── Login.js           # Login & quick registration
│   │       ├── Register.js        # Full registration form
│   │       ├── Dashboard.js       # Main dashboard layout
│   │       ├── Users.js           # User discovery page
│   │       ├── Chat.js            # One-on-one chat interface
│   │       ├── Groups.js          # Group listing page
│   │       ├── GroupCreate.js     # Group creation form
│   │       ├── GroupChat.js       # Group chat interface
│   │       ├── ContactsList.js    # User's contacts
│   │       └── ContactRequests.js # Manage contact requests
│   └── package.json
├── server/                 # Node.js backend application
│   ├── server.js          # Main server file
│   ├── config/
│   │   ├── database.js    # MongoDB connection
│   │   └── socket.js      # Socket.IO configuration
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT authentication middleware
│   ├── models/
│   │   ├── User.js        # User model schema
│   │   ├── Message.js     # Message model schema
│   │   └── Group.js       # Group model schema
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   ├── users.js       # User management routes
│   │   ├── messages.js    # Messaging routes
│   │   ├── groups.js      # Group management routes
│   │   └── contacts.js    # Contact management routes
│   └── package.json
└── README.md              # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/Rishithagaddam/Chat_app.git
cd Chat_app
```

### 2. Server Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
touch .env

# Add the following to .env file:
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
CLIENT_URL=http://localhost:3000
```

### 3. Client Setup
```bash
# Navigate to client directory (in a new terminal)
cd client

# Install dependencies
npm install
```

### 4. Database Setup
- Ensure MongoDB is running on your system
- The application will automatically create the required collections
- For MongoDB Atlas, replace the MONGODB_URI with your connection string

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Server** (Terminal 1):
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

2. **Start the Client** (Terminal 2):
```bash
cd client
npm start
```
Client will run on `http://localhost:3000`

### Production Mode

1. **Build the Client**:
```bash
cd client
npm run build
```

2. **Start the Server**:
```bash
cd server
npm start
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Contacts
- `POST /api/contacts/send-request` - Send contact request
- `POST /api/contacts/accept-request` - Accept contact request
- `POST /api/contacts/reject-request` - Reject contact request
- `GET /api/contacts` - Get user's contacts
- `GET /api/contacts/requests` - Get contact requests

### Messages
- `GET /api/messages/:userId` - Get chat messages with user
- `POST /api/messages` - Send a message

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get group details
- `GET /api/groups/:id/messages` - Get group messages
- `POST /api/groups/:id/messages` - Send group message

## 🔧 Environment Variables

### Server (.env)
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## 🎨 Design Features

### Color Palette
- **Primary Dark**: `#4a1e2c` - Deep burgundy for headers and important elements
- **Primary Medium**: `#8b4a4a` - Medium burgundy for buttons and accents
- **Primary Light**: `#c97676` - Light burgundy for highlights
- **Accent Light**: `#f5e6d3` - Warm cream for backgrounds and cards
- **White**: `#ffffff` - Pure white for content areas

### Key Design Elements
- **Gradient Backgrounds** - Beautiful color transitions
- **Card-based Layout** - Modern, clean component design
- **Smooth Animations** - Engaging user interactions
- **Responsive Design** - Mobile-first approach
- **Professional Typography** - Clean, readable fonts
- **Shadow Effects** - Subtle depth and dimension

## 🚀 Features in Detail

### Real-time Communication
- **Socket.IO Integration** - Instant message delivery
- **Room Management** - Separate chat rooms for different conversations
- **Online Status** - Real-time user presence indicators
- **Message Persistence** - All messages saved to MongoDB
- **Optimistic Updates** - Immediate UI updates with fallback

### User Experience
- **Smooth Navigation** - React Router for seamless page transitions
- **Loading States** - Visual feedback during operations
- **Error Handling** - User-friendly error messages
- **Form Validation** - Client and server-side validation
- **Responsive Layout** - Works perfectly on all device sizes

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in .env file
   - Verify network connectivity for MongoDB Atlas

2. **Socket.IO Connection Issues**
   - Check if both server and client are running
   - Verify CORS settings in server configuration
   - Ensure firewall isn't blocking connections

3. **JWT Authentication Errors**
   - Verify JWT_SECRET is set in .env
   - Check if token is properly stored in localStorage
   - Ensure middleware is properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rishitha Gaddam**
- GitHub: [@Rishithagaddam](https://github.com/Rishithagaddam)

## 🙏 Acknowledgments

- Create React App for the initial React setup
- Socket.IO for real-time communication capabilities
- MongoDB for the flexible database solution
- The React and Node.js communities for excellent documentation

## 📧 Support

If you have any questions or need help with setup, please open an issue in the GitHub repository or contact the author.

---

**Happy Chatting! 💬✨**