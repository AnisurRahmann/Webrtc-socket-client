import { Server } from "socket.IO";

const SocketHandler = (req: Request, res: any) => {
  if (res.socket.server.io) {
    console.log(res.method);
    console.log("running server");
  } else {
    console.log("Socket is initilizing");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    io.on("connection", (socket: any) => {
      console.log("a user connected", socket.id);
    });
  }

  res.end();
};

export default SocketHandler;
