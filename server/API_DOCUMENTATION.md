# Chat App API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "isOnline": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "emailOrPhone": "john@example.com", // or phone number
    "password": "password123"
  }
  ```
- **Response:** Same as register

#### Get Current User
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      // ... other user fields
    }
  }
  ```

#### Logout User
- **POST** `/api/auth/logout`
- **Headers:** `Authorization: Bearer <token>`

### User Routes (`/api/users`)

#### Get All Users
- **GET** `/api/users`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "success": true,
    "count": 5,
    "users": [
      {
        "id": "user-id",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phoneNumber": "+1234567891",
        "isOnline": true,
        "lastSeen": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### Get User by ID
- **GET** `/api/users/:id`
- **Headers:** `Authorization: Bearer <token>`

#### Update Profile
- **PUT** `/api/users/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "name": "Updated Name",
    "email": "updated@example.com",
    "phoneNumber": "+1234567892"
  }
  ```

#### Search Users
- **GET** `/api/users/search/:query`
- **Headers:** `Authorization: Bearer <token>`

### Message Routes (`/api/messages`)

#### Get Messages with User
- **GET** `/api/messages/:userId`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "success": true,
    "count": 10,
    "chatWith": {
      "id": "user-id",
      "name": "Jane Doe",
      // ... user info
    },
    "messages": [
      {
        "id": "message-id",
        "sender": { /* user info */ },
        "receiver": { /* user info */ },
        "message": "Hello!",
        "messageType": "text",
        "isRead": true,
        "readAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### Send Message
- **POST** `/api/messages`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "receiverId": "user-id",
    "message": "Hello there!",
    "messageType": "text" // optional, defaults to "text"
  }
  ```

#### Get Conversations
- **GET** `/api/messages`
- **Headers:** `Authorization: Bearer <token>`

#### Mark Message as Read
- **PUT** `/api/messages/:messageId/read`
- **Headers:** `Authorization: Bearer <token>`

## Socket.IO Events

### Client to Server Events

#### Authentication
```javascript
socket.auth = {
  token: 'your-jwt-token'
};
```

#### Join/Leave Room
```javascript
socket.emit('joinRoom', 'room-id');
socket.emit('leaveRoom', 'room-id');
```

#### Send Message
```javascript
socket.emit('sendMessage', {
  receiverId: 'user-id',
  message: 'Hello!',
  messageType: 'text' // optional
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  receiverId: 'user-id',
  isTyping: true
});
```

#### Mark Message as Read
```javascript
socket.emit('markMessageRead', {
  messageId: 'message-id'
});
```

### Server to Client Events

#### User Online/Offline
```javascript
socket.on('userOnline', (data) => {
  // { userId, user, isOnline: true }
});

socket.on('userOffline', (data) => {
  // { userId, user, isOnline: false, lastSeen }
});
```

#### Online Users List
```javascript
socket.on('onlineUsers', (users) => {
  // Array of online users
});
```

#### Receive Messages
```javascript
socket.on('receiveMessage', (data) => {
  // { message: { /* message object */ } }
});

socket.on('newMessage', (data) => {
  // { message: { /* message object */ } }
});
```

#### Message Delivery & Read Receipts
```javascript
socket.on('messageDelivered', (data) => {
  // { success: true, message: { /* message object */ } }
});

socket.on('messageRead', (data) => {
  // { messageId, readBy, readAt }
});
```

#### Typing Indicators
```javascript
socket.on('userTyping', (data) => {
  // { userId, user, isTyping }
});
```

#### Errors
```javascript
socket.on('messageError', (error) => {
  // { error: 'Error message' }
});
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

Create a `.env` file with:
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```