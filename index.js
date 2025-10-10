import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const PORT = 3001; // change if needed

// Explicitly allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://socket.felixandfingers.com",
  "https://songdrop.felixandfingers.com",
  "https://darkgrey-hare-375374.hostingersite.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow server-to-server / Postman
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.emit("welcome", { socketWelcome: true });

  socket.on("refresh-songs", (data) => io.emit("refresh-songs-req", data));
  socket.on("guest-request", (data) => io.emit("update-songs", data));
  socket.on("sent-by-player-req", (data) => io.emit("sent-by-player-res", data));
  socket.on("play-song-req", (data) => io.emit("play-song-res", data));
  socket.on("refund-song-req", (data) => io.emit("refund-song-res", data));
  socket.on("substitute-song-req", (data) => io.emit("substitute-song-res", data));
  socket.on("end-concert-req", (data) => io.emit("end-concert-res", data));
});

app.get("/", (req, res) => {
  res.send("Songdrop Socket Phase II");
});

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
