import "dotenv/config";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const PORT = Number(process.env.HTTP_PORT || process.env.PORT || 3000);

/**
 * LiteSpeed on this host treats dotted paths (e.g. /socket.io/) as static files
 * and never reverse-proxies them to Node. Use a path WITHOUT a file extension.
 */
const SOCKET_PATH = process.env.SOCKET_PATH || "/sd-socket/";

// Explicitly allowed browser origins (scheme + host, no trailing slash)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://socket.felixandfingers.com",
  "https://songdrop.felixandfingers.com",
  "https://www.songdrop.felixandfingers.com",
  "https://songdrop.live",
  "https://www.songdrop.live",
  "https://darkgrey-hare-375374.hostingersite.com",
  "https://lightcoral-clam-624972.hostingersite.com",
];

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser / same-origin tools (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reject quietly — throwing Error makes Express 5 return 500
    return callback(null, false);
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const SOCKET_KEY = process.env.SOCKET_KEY || "";

/** WordPress POSTs here for support + notifications (Viktor cannot use the browser socket). */
const SERVER_EMIT_EVENTS = new Set(["support-update-res", "notification-res"]);

const server = createServer(app);
const io = new Server(server, {
  path: SOCKET_PATH,
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

app.post("/emit", (req, res) => {
  if (SOCKET_KEY && req.headers["x-socket-key"] !== SOCKET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { event, data } = req.body || {};
  if (!event || !SERVER_EMIT_EVENTS.has(event)) {
    return res.status(400).json({ error: "Invalid or disallowed event" });
  }

  io.emit(event, data || {});
  return res.json({ ok: true });
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.emit("welcome", { socketWelcome: true });

  socket.on("refresh-songs", (data) => io.emit("refresh-songs-req", data));
  socket.on("guest-request", (data) => io.emit("update-songs", data));
  socket.on("sent-by-player-req", (data) =>
    io.emit("sent-by-player-res", data),
  );
  socket.on("play-song-req", (data) => io.emit("play-song-res", data));
  socket.on("refund-song-req", (data) => io.emit("refund-song-res", data));
  socket.on("substitute-song-req", (data) =>
    io.emit("substitute-song-res", data),
  );
  socket.on("end-concert-req", (data) => io.emit("end-concert-res", data));
  socket.on("concert-update", (data) => io.emit("concert-update-res", data));
  socket.on("credits-info-req", (data) => io.emit("credits-info-res", data));
  socket.on("test-req", (data) => io.emit("test-res", data));
  socket.on("send-admin-reg-req", (data) =>
    io.emit("send-admin-reg-res", data),
  );
  socket.on("phrase-req", (data) => io.emit("phrase-res", data));
  socket.on("stop-song-req", (data) => io.emit("stop-song-res", data));
  socket.on("option-update-req", (data) => io.emit("option-update-res", data));
  socket.on("event-type-update-req", (data) =>
    io.emit("event-type-update-res", data),
  );
  socket.on("community-update-req", (data) =>
    io.emit("community-update-res", data),
  );
});

app.get("/", (req, res) => {
  res.send("SongDrop socket server — new Viktor socket update: POST /emit (support + notifications), community-update-req relay");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
    socketPath: SOCKET_PATH,
    timestamp: new Date().toISOString(),
    note: "New Viktor socket update: POST /emit for support-update-res + notification-res; community-update-req → community-update-res",
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (path ${SOCKET_PATH})`);
});
