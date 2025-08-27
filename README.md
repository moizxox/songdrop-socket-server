# SongDrop Socket Server

A WebSocket server for SongDrop application using Socket.IO, handling real-time communication between clients.

## Features

- Real-time communication using Socket.IO
- CORS configuration for secure connections
- Health check endpoint
- Comprehensive error logging

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd songdrop-socket-server

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=3001
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://songdrop.felixandfingers.com/,https://socket.felixandfingers.com,wss://socket.felixandfingers.com,ws://socket.felixandfingers.com
```

Adjust the `CORS_ALLOWED_ORIGINS` as needed for your environment.

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## API Endpoints

- `GET /`: Simple check to verify the server is running
- `GET /health`: Health check endpoint that returns server status information

## Socket Events

### Server Events (Emitted by the server)

- `welcome`: Sent when a client connects
- `refresh-songs-req`: Broadcast to all clients to refresh songs
- `update-songs`: Broadcast to update songs
- `sent-by-player-res`: Response to player requests
- `play-song-res`: Response to play song requests
- `refund-song-res`: Response to refund song requests
- `substitute-song-res`: Response to substitute song requests

### Client Events (Listened by the server)

- `refresh-songs`: Request to refresh songs
- `guest-request`: Guest song request
- `sent-by-player-req`: Request sent by player
- `play-song-req`: Request to play a song
- `refund-song-req`: Request to refund a song
- `substitute-song-req`: Request to substitute a song

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the client origin is included in the `CORS_ALLOWED_ORIGINS` environment variable.
2. **Connection Failures**: Check network connectivity and firewall settings.
3. **WebSocket Failures**: Some networks might block WebSocket connections. The server falls back to polling in such cases.

## License

ISC