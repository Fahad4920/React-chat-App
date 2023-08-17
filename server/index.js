const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());
const socketIO = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    if (data.room) {
      socket.join(data.room); // Join the specified room
      console.log(`User with ID: ${socket.id} joined room: ${data.room}`);
    } else {
      console.log("Invalid room data:", data);
    }
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data); // Emit received message to the room
  });

  socket.on("send_audio", (data) => {
    // Emit the received audio data to all clients in the same room
    io.to(data.room).emit("receive_audio", data.audio);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });

  socket.emit("join_room", { room: "roomName" });
  
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});


