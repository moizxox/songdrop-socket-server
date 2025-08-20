import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.emit("welcome", { socketWelcome: true });

  socket.on("refresh-songs", (data) => {
    console.log("Song sent by guest:");
    io.emit("refresh-songs-req", { refreshSongs: true });
  });

  socket.on('guest-request', (data) => {
    // console.log('song updated by guest',data)
    io.emit('update-songs')
  })

  socket.on('sent-by-player-req',()=>{
    io.emit('sent-by-player-res')
  })

  socket.on('play-song-req',()=>{
    io.emit('play-song-res')
  })
  socket.on('refund-song-req',()=>{
    io.emit('refund-song-res')
  })
  socket.on('substitute-song-req',()=>{
    io.emit('substitute-song-res')
  })
});

app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
