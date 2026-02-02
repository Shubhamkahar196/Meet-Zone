import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server,{
    cors: {
        origin: "*",
        methods: ["GET","POST"],
        allowedHeaders: ["*"],
        credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("something called");

    socket.on("join-call", (path) => {

      if (!connections[path]) connections[path] = [];

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      connections[path].forEach(id => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      });

      if (messages[path]) {
        messages[path].forEach(msg => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {

      const [room, found] = Object.entries(connections).reduce(
        ([r, f], [key, value]) => {
          if (!f && value.includes(socket.id)) return [key, true];
          return [r, f];
        },
        ["", false]
      );

      if (found) {
        if (!messages[room]) messages[room] = [];

        messages[room].push({
          sender,
          data,
          "socket-id-sender": socket.id
        });

        connections[room].forEach(id => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {

      for (const [k, v] of Object.entries(connections)) {
        if (v.includes(socket.id)) {

          connections[k] = v.filter(id => id !== socket.id);

          v.forEach(id => {
            io.to(id).emit("user-left", socket.id);
          });

          if (connections[k].length === 0) delete connections[k];
        }
      }
    });
  });

  return io;
};