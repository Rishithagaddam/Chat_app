# 💬 Modern Chat Application

A full-stack real-time chat application built with React, Node.js, Express, MongoDB, and Socket.IO. The application features a modern, professional design with a beautiful color palette and comprehensive chat functionality including advanced group features, media sharing, message controls, and real-time presence indicators.

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
- **Real-time Online Status** - Dynamic presence indicators with activity tracking
- **Auto-logout on Inactivity** - Automatic offline status after 5 minutes of inactivity
- **Last Seen Timestamps** - Shows when users were last active

### 👥 Contact Management
- **User Discovery** - Browse and discover all registered users with real-time status
- **Contact Requests** - Send, receive, accept, and reject contact requests
- **Contact List** - Manage your trusted connections with online indicators
- **Smart Contact Filtering** - Only contacts can start direct conversations
- **Contact Status Updates** - Real-time updates when contacts come online/offline
- **Back Navigation** - Easy navigation with back buttons on all pages

### 💬 Advanced Real-time Messaging
- **One-on-One Chat** - Private conversations between contacts
- **Group Chat** - Create and participate in group conversations with role-based permissions
- **Real-time Delivery** - Instant message delivery with Socket.IO
- **Message Status Indicators** - Pending, delivered, and read status
- **Chat History** - Persistent message storage and retrieval
- **Auto-scroll** - Automatic scrolling to latest messages
- **Optimistic Updates** - Immediate UI feedback with server confirmation

### 🎛️ Advanced Message Controls
- **Always Visible Controls** - Message controls always accessible (no hover required)
- **Message Reactions** - React to messages with emojis (👍 ❤️ 😂 😮 😢 😡)
- **Message Editing** - Edit sent messages within 15-minute time limit
- **Message Deletion** - Delete sent messages (soft delete with "This message was deleted")
- **Pinned Messages** - Pin important messages in chats and groups
- **Message Forwarding** - Forward messages to other users or groups
- **Quote/Reply System** - Quote and reply to specific messages with context
- **Message Threading** - Quoted message preview with original sender info
- **Decreased Message Width** - Optimized message layout (85% max width, responsive)

### 📱 Media Sharing & Gallery
- **Multi-format Media Upload** - Support for images, videos, audio files, and documents
- **Group Media Sharing** - Upload and share media directly in group chats
- **Media Gallery Tab** - Dedicated section showing all shared media in groups
- **Media Preview** - Inline preview for images and videos
- **File Download** - Click to download shared files
- **Media Organization** - Grid layout for easy browsing of shared content
- **File Type Icons** - Visual indicators for different file types
- **Media Statistics** - File size and upload date information

### 🎯 Advanced Group Features
- **Tabbed Group Interface** - Chat, Announcements, Polls, Media, Members tabs
- **Role-based Permissions** - Admin, Moderator, and Member roles with specific permissions
- **Group Announcements** - Dedicated announcement system with priority levels (Low, Medium, High, Urgent)
- **Polls & Voting** - Create polls with multiple options, voting statistics, and results visualization
- **Member Management** - Role assignment, member addition/removal by admins
- **Group Settings** - Configurable permissions and group preferences
- **Real-time Group Updates** - Live updates for all group activities
- **Sender Identification** - Clear sender names in group messages ("You" for own messages)

### 🎨 Modern UI/UX Design
- **Professional Design** - Beautiful burgundy gradient theme with warm accents
- **Responsive Layout** - Mobile-first design that works perfectly on all devices
- **Smooth Animations** - Fade-in, slide-in, and hover effects throughout
- **Intuitive Navigation** - Easy-to-use interface with consistent back navigation
- **Card-based Layout** - Modern card design for all components
- **Custom Styling** - Professional color scheme with CSS variables
- **Loading States** - Visual feedback during all operations
- **Error Handling** - User-friendly error messages and fallbacks

### 🔄 Real-time Features
- **Live Typing Indicators** - See when someone is typing
- **Presence Tracking** - Real-time online/offline status with activity monitoring
- **Live Message Updates** - Real-time message editing, deletion, and reactions
- **Group Activity Sync** - Live updates for polls, announcements, and member changes
- **Socket Recovery** - Automatic reconnection and message sync
- **Multi-tab Support** - Synchronized experience across multiple browser tabs

## 🚀 Technology Stack

### Frontend
- **React 19.2.0** - Modern React with hooks and functional components
- **Redux Toolkit** - State management for contacts and user data
- **React Router DOM** - Client-side routing and navigation
- **Socket.IO Client** - Real-time bidirectional communication
- **Axios** - HTTP client for API requests
- **CSS3** - Custom styling with CSS variables and modern features

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - MongoDB object modeling with advanced schemas
- **Socket.IO** - Real-time bidirectional event-based communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing and security
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling for media sharing

## 📁 Enhanced Project Structure

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
│   │   ├── socket.js       # Socket.IO client with activity tracking
│   │   ├── app/
│   │   │   └── store.js    # Redux store configuration
│   │   ├── components/     # Reusable components
│   │   │   ├── GroupTabs.js           # Group navigation tabs
│   │   │   ├── MessageControls.js     # Message action controls
│   │   │   ├── MediaUpload.js         # Media file upload component
│   │   │   ├── MediaMessages.js       # Media message display
│   │   │   ├── AnnouncementCreator.js # Group announcement creator
│   │   │   ├── PollCreator.js         # Poll creation component
│   │   │   └── GroupRoleManager.js    # Group role management
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
│   │       ├── GroupChat.js       # Advanced group chat interface
│   │       ├── ContactsList.js    # User's contacts
│   │       └── ContactRequests.js # Manage contact requests
│   └── package.json
├── server/                 # Node.js backend application
│   ├── server.js          # Main server file
│   ├── config/
│   │   ├── database.js    # MongoDB connection
│   │   └── socket.js      # Socket.IO configuration with activity tracking
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication middleware
│   │   └── uploadMiddleware.js    # File upload middleware
│   ├── models/
│   │   ├── User.js        # Enhanced User model with presence tracking
│   │   ├── Message.js     # Advanced Message model with reactions, editing
│   │   ├── Group.js       # Group model with roles and permissions
│   │   ├── Poll.js        # Poll model for group voting
│   │   └── Announcement.js # Announcement model for group updates
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   ├── users.js       # User management routes
│   │   ├── messages.js    # Enhanced messaging routes
│   │   ├── groups.js      # Advanced group management routes
│   │   ├── contacts.js    # Contact management routes
│   │   ├── polls.js       # Poll management routes
│   │   ├── announcements.js # Announcement management routes
│   │   ├── media.js       # Media upload routes
│   │   └── voice.js       # Voice message routes
│   └── package.json
└── README.md              # This comprehensive documentation
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
NODE_ENV=development
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

## 🎯 Enhanced API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with status update
- `POST /api/auth/logout` - User logout with offline status
- `GET /api/auth/me` - Get current user profile

### Users & Contacts
- `GET /api/users` - Get all users with online status
- `POST /api/contacts/send-request` - Send contact request
- `POST /api/contacts/accept-request` - Accept contact request
- `POST /api/contacts/reject-request` - Reject contact request
- `GET /api/contacts` - Get user's contacts with status
- `GET /api/contacts/requests` - Get contact requests

### Enhanced Messaging
- `GET /api/messages/:userId` - Get chat messages with user
- `POST /api/messages` - Send a message
- `PUT /api/messages/:id/edit` - Edit a message
- `DELETE /api/messages/:id` - Delete a message
- `POST /api/messages/:id/react` - Add reaction to message
- `POST /api/messages/:id/pin` - Pin/unpin message
- `POST /api/messages/quote` - Send quoted message
- `GET /api/messages/group/:groupId/media` - Get group media files

### Advanced Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get group details with members
- `GET /api/groups/:id/messages` - Get group messages
- `POST /api/groups/:id/messages` - Send group message
- `PUT /api/groups/:groupId/members/:memberId/role` - Update member role
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member

### Polls & Announcements
- `POST /api/polls` - Create a poll
- `GET /api/polls/group/:groupId` - Get group polls
- `POST /api/polls/:pollId/vote` - Vote on poll
- `DELETE /api/polls/:pollId` - Delete poll
- `POST /api/announcements` - Create announcement
- `GET /api/announcements/group/:groupId` - Get group announcements
- `POST /api/announcements/:id/pin` - Pin/unpin announcement

### Media Upload
- `POST /api/media/upload/image` - Upload image
- `POST /api/media/upload/audio` - Upload audio
- `POST /api/media/upload/video` - Upload video
- `POST /api/media/upload/file` - Upload file
- `POST /api/media/upload/voice` - Upload voice message

## 🎨 Enhanced Design Features

### Color Palette
- **Primary Dark**: `#4a1e2c` - Deep burgundy for headers and important elements
- **Primary Medium**: `#8b4a4a` - Medium burgundy for buttons and accents
- **Primary Light**: `#c97676` - Light burgundy for highlights
- **Accent Light**: `#f5e6d3` - Warm cream for backgrounds and cards
- **White**: `#ffffff` - Pure white for content areas
- **Success**: `#00b894` - Green for online status and success states
- **Error**: `#ff6b6b` - Red for errors and urgent notifications

### Advanced UI Elements
- **Message Width Optimization** - Decreased message width for better readability
- **Always Visible Controls** - No hover required for message actions
- **Tabbed Interfaces** - Clean organization of group features
- **Progress Bars** - Visual feedback for polls and uploads
- **Status Indicators** - Real-time presence and activity indicators
- **Responsive Grid Layouts** - Perfect media gallery presentation
- **Professional Icons** - Consistent iconography throughout

## 🚀 Advanced Features in Detail

### Real-time Communication
- **Socket.IO Integration** - Instant message delivery across all devices
- **Room Management** - Separate chat rooms for different conversations
- **Activity Tracking** - Mouse, keyboard, and scroll activity monitoring
- **Presence Indicators** - Real-time user online/offline status
- **Message Persistence** - All messages saved to MongoDB with full history
- **Optimistic Updates** - Immediate UI updates with server confirmation

### Group Management
- **Role-based Access Control** - Admin, Moderator, Member permissions
- **Dynamic Permission System** - Configurable group settings
- **Real-time Member Updates** - Live role changes and member management
- **Comprehensive Audit Trail** - Track all group activities and changes

### Media & File Handling
- **Multi-format Support** - Images, videos, audio, documents
- **File Size Optimization** - Automatic compression and thumbnails
- **Gallery Organization** - Grid layout with metadata display
- **Download Management** - Direct file downloads with proper naming

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally or check Atlas connection
   - Verify MONGODB_URI format in .env file
   - Check network connectivity and firewall settings

2. **Socket.IO Connection Issues**
   - Verify both server and client are running on correct ports
   - Check CORS settings in server configuration
   - Ensure no firewall blocking WebSocket connections

3. **JWT Authentication Errors**
   - Verify JWT_SECRET is set in .env file
   - Check if token is properly stored in localStorage
   - Ensure middleware is correctly applied to protected routes

4. **File Upload Issues**
   - Check file size limits and supported formats
   - Verify uploads directory exists and has write permissions
   - Ensure proper multipart/form-data handling

5. **Real-time Features Not Working**
   - Check Socket.IO connection status in browser console
   - Verify authentication token is passed to socket
   - Ensure proper event listeners are registered

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow React best practices and hooks patterns
- Use TypeScript for better code quality (future enhancement)
- Implement proper error boundaries and loading states
- Add unit tests for critical functionality
- Follow Material Design principles for UI/UX

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rishitha Gaddam**
- GitHub: [@Rishithagaddam](https://github.com/Rishithagaddam)
- LinkedIn: [Connect with me](https://linkedin.com/in/rishitha-gaddam)

## 🙏 Acknowledgments

- Create React App for the initial React setup
- Socket.IO for excellent real-time communication capabilities
- MongoDB for flexible document storage
- The React and Node.js communities for comprehensive documentation
- Material Design and modern UI/UX principles

## 📧 Support & Contact

If you have any questions, suggestions, or need help with setup:
- Open an issue in the GitHub repository
- Contact the author through GitHub
- Check the troubleshooting section above

## 🔮 Future Enhancements

- **Video/Voice Calls** - WebRTC integration for voice and video calls
- **Message Encryption** - End-to-end encryption for private conversations
- **Push Notifications** - Browser and mobile push notifications
- **File Sharing Integration** - Google Drive, Dropbox integration
- **Advanced Search** - Full-text search across all messages
- **Message Scheduling** - Schedule messages for later delivery
- **Themes & Customization** - Multiple color themes and customization options
- **Mobile App** - React Native mobile application
- **AI Integration** - Smart reply suggestions and message translation

---

**Happy Chatting! 💬✨**

*Built with ❤️ using modern web technologies*