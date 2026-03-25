import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameEngine } from './GameEngine.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' } });

const game = new GameEngine();
setInterval(() => {
  game.spawnMole();
  io.emit('gameState', game.getState());
}, 300);

io.on('connection', (socket) => {
  console.log('Player connected: ', socket.id);

  game.addPlayer(socket.id);
  // send update to everyone
  io.emit('gameState', game.getState());

  socket.on('setPlayerName', (name) => {
    game.setPlayerName(socket.id, name);
    io.emit('gameState', game.getState());
  });

  socket.on('whack', (holeIndex) => {
    console.log('whack', holeIndex);
    const updated = game.handleWhack(socket.id, holeIndex);
    if (updated) {
      // only confirm successful whack to player
      socket.emit('hitConfirmed', holeIndex);

      // send everyone
      // console.log('gamestate', game.getState());
      io.emit('gameState', game.getState());
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconected:', socket.id);
    game.removePlayer(socket.id);
    io.emit('gameState', game.getState());
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
