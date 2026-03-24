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
}, 1500);

io.on('connection', (socket) => {
  console.log('Player connected: ', socket.id);

  game.addPlayer(socket.id);
  socket.emit('gameState', game.getState());
  io.emit('gameState', game.getPlayers()); // send update to everyone

  socket.on('setPlayerName', (name) => {
    game.setPlayerName(socket.id, name);
    io.emit('gameState', game.getState());
  });

  socket.on('whack', (holeIndex) => {
    console.log('whack', holeIndex);
    const updated = game.handleWhack(socket.id, holeIndex);
    if (updated) {
      io.emit('gameState', game.getState());
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconected:', socket.id);
    game.removePlayer(socket.id);
    io.emit('gameState', game.getPlayers());
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
