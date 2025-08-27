import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// Convert comma-separated origins from .env into array
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()) : [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests like Postman
    
    // Check if the origin matches any of the allowed origins
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Remove trailing slash if present for consistent comparison
      const normalizedAllowedOrigin = allowedOrigin.endsWith('/') 
        ? allowedOrigin.slice(0, -1) 
        : allowedOrigin;
      
      return origin === normalizedAllowedOrigin || origin.startsWith(normalizedAllowedOrigin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Log middleware for connection events
io.engine.on('connection_error', (err) => {
  console.error('Connection error:', err.req.url, err.code, err.message);
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, "from origin:", socket.handshake.headers.origin);

  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.id, "reason:", reason);
  });
  
  socket.on("error", (error) => {
    console.error("Socket error:", socket.id, error);
  });

  socket.emit("welcome", { socketWelcome: true });

  socket.on("refresh-songs", (data) => io.emit("refresh-songs-req", { data }));
  socket.on("guest-request", (data) => io.emit("update-songs", { data }));
  socket.on("sent-by-player-req", (data) => io.emit("sent-by-player-res", { data }));
  socket.on("play-song-req", (data) => io.emit("play-song-res", { data }));
  socket.on("refund-song-req", (data) => io.emit("refund-song-res", { data }));
  socket.on("substitute-song-req", (data) => io.emit("substitute-song-res", { data }));
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running");
});

app.get("/health", (req, res) => {
  const status = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    cors: {
      allowedOrigins
    }
  };
  res.json(status);
});

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
