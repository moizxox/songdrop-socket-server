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
  "https://songdrop.live",
  "https://lightcoral-clam-624972.hostingersite.com",
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
app.use(express.json({ limit: "64kb" }));

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
  // socket.on("concert-update", (data) => console.log("Concert updated", data));
  socket.on("concert-update", (data) => io.emit("concert-update-res", data));
  socket.on("credits-info-req", (data) => io.emit("credits-info-res", data));
  socket.on("test-req", (data) => io.emit("test-res", data));
  socket.on("send-admin-reg-req", (data) => io.emit("send-admin-reg-res", data));
  socket.on("phrase-req", (data) => io.emit("phrase-res", data));
  socket.on("stop-song-req", (data) => io.emit("stop-song-res", data));
  socket.on("option-update-req", (data) => io.emit("option-update-res", data));
  socket.on("event-type-update-req", (data) => io.emit("event-type-update-res", data));
});

// Server-to-server broadcast.
//
// Every other event here is relayed browser -> browser. Support replies and
// notifications are written by WordPress, which is not a socket client, so PHP
// posts them here instead and we relay them with the same io.emit fan-out the
// browser events use. Clients filter on user_id, exactly like they already
// filter on concert_id.
const RELAYABLE_EVENTS = new Set([
  "support-update-res",
  "notification-res",
  "community-update-res",
]);

app.post("/emit", (req, res) => {
  // Optional shared secret: set SOCKET_EMIT_KEY on this server AND define
  // SD_SOCKET_KEY in wp-config to lock the endpoint down. Left unset, it stays
  // open like the socket events themselves.
  const expected = process.env.SOCKET_EMIT_KEY;
  if (expected && req.get("x-socket-key") !== expected) {
    return res.status(401).json({ ok: false, error: "bad key" });
  }

  const { event, data } = req.body || {};
  if (!RELAYABLE_EVENTS.has(event)) {
    return res.status(400).json({ ok: false, error: "event not relayable" });
  }

  io.emit(event, data || {});
  return res.json({ ok: true, event, connections: io.engine.clientsCount });
});

app.get("/", (req, res) => {
  res.send("Songdrop Socket Phase Reviews Update");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
