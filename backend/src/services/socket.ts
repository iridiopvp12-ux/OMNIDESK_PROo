import { Server as SocketIo } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIo;

export const initIO = (httpServer: HttpServer) => {
    io = new SocketIo(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("Client Connected", socket.id);
        socket.on("disconnect", () => {
            console.log("Client Disconnected", socket.id);
        });
    });
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket IO not initialized!");
    }
    return io;
};
