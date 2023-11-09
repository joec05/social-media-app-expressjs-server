import express, { Express, Request, Response } from 'express';
import dotenv from '../node_modules/dotenv/lib/main.js';
import bodyParser from 'body-parser';
import usersRoutes from './controllers/users.js';
import { Server } from "socket.io";
import { createServer } from 'http';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const hostname = '0.0.0.0';
const port = 5001;

app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use(bodyParser.json({limit: "1gb"}));
app.use(bodyParser.urlencoded({limit: "1gb", extended: true, parameterLimit: 500000}));

var httpServer = createServer(app);

const io = new Server(httpServer, {
  allowEIO3: true,
  maxHttpBufferSize: 1e8, pingTimeout: 60000,
  httpCompression: {
    threshold: 1000,
    chunkSize: 16 * 1000,
    windowBits: 15,
    memLevel: 8,
  }
});

io.on("connection", (socket) => {
  console.log('Client connected.');

  socket.on('disconnect', function() {
    console.log('Client disconnected.');
  });

  socket.on("send-private-message-to-server", (data) => {
    console.log(data);
    io.emit(`send-private-message-${data.sender}-${data.recipient}`, {...data});
    io.emit(`update-latest-private-message-${data.sender}`, {...data});
    io.emit(`update-latest-private-message-${data.recipient}`, {...data});
  });

  socket.on("delete-private-message-to-server", (data) => {
    io.emit(`delete-private-message-${data.currentID}-${data.recipient}`, {...data});
    io.emit(`remove-latest-private-message-${data.currentID}`, {...data});
  });

  socket.on("delete-private-message-for-all-to-server", (data) => {
    io.emit(`delete-private-message-for-all-${data.currentID}-${data.recipient}`, {...data});
    io.emit(`remove-latest-private-message-${data.currentID}`, {...data});
    io.emit(`remove-latest-private-message-${data.recipient}`, {...data});
  });

  socket.on("send-group-message-to-server", (data) => {
    io.emit(`send-group-message-${data.chatID}`, {...data});
    for(var i = 0; i < data.recipients.length; i++){
      io.emit(`update-latest-group-message-${data.recipients[i]}`, {...data});
    }
  });

  socket.on("delete-group-message-to-server", (data) => {
    io.emit(`delete-group-message-${data.currentID}-${data.chatID}`, {...data});
    io.emit(`remove-latest-group-message-${data.currentID}`, {...data});
  });

  socket.on("delete-group-message-for-all-to-server", (data) => {
    io.emit(`delete-group-message-for-all-${data.chatID}`, {...data});
    for(var i = 0; i < data.recipients.length; i++){
      io.emit(`remove-latest-group-message-${data.recipients[i]}`, {...data});
    }
  });

  socket.on("edit-group-profile-to-server", (data) => {
    io.emit(`send-edit-group-announcement-${data.chatID}`, {...data});
    io.emit(`edit-group-profile-page-${data.chatID}`, {...data});
    for(var i = 0; i < data.recipients.length; i++){
      io.emit(`update-latest-edit-group-profile-announcement-${data.recipients[i]}`, {...data});
    }
  });

  socket.on("leave-group-to-server", (data) => {
    io.emit(`send-leave-group-announcement-${data.chatID}`, {...data});
    io.emit(`leave-group-sender-${data.sender}`, {...data});
    for(var i = 0; i < data.recipients.length; i++){
      io.emit(`update-latest-leave-group-announcement-${data.recipients[i]}`, {...data});
    }
  });

  socket.on("add-users-to-group-to-server", (data) => {
    console.log('adding users');
    console.log(data);
    io.emit(`send-add-users-to-group-announcement-${data.chatID}`, {...data});
    for(var i = 0; i < data.recipients.length; i++){
      io.emit(`update-latest-add-users-to-group-announcement-${data.recipients[i]}`, {...data});
    }
    console.log(data);
    for(var i = 0; i < data.addedUsersID.length; i++){
      io.emit(`add-new-chat-to-added-users-${data.addedUsersID[i]}`, {...data});
    }
  });

  socket.on("block-user-to-server", (data) => {
    console.log(data);
    io.emit(`update-is-blocked-by-sender-id-user-data-${data.senderID}`, {...data});
    io.emit(`update-block-sender-id-user-data-${data.blockedUserID}`, {...data});
  });

  socket.on("unblock-user-to-server", (data) => {
    io.emit(`update-is-unblocked-by-sender-id-user-data-${data.senderID}`, {...data});
    io.emit(`update-unblock-sender-id-user-data-${data.unblockedUserID}`, {...data});
  });
});


app.get('/', (req, res) => {
  res.send({
      "success": true,
      "message": "Welcome to backend zone!"
  });
});

app.use('/users', usersRoutes);


httpServer.listen(port, () => console.log(`Server running on port: http://localhost:${port}`));

