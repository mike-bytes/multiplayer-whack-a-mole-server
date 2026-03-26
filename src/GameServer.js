import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameEngine } from './GameEngine.js';
import { TICK_RATE } from './constants/constants.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' } });

let countdownRunning = false;
const game = new GameEngine();
setInterval(() => {
  game.update();
  const state = game.getState();
  io.emit('gameState', state);

  if (state.winner && !countdownRunning) {
    countdownRunning = true;
    // start countdown on clients
    const endTime = Date.now() + 10000;
    io.emit('startCountdown', endTime);

    setTimeout(() => {
      game.resetGame();
      countdownRunning = false;
      io.emit('gameState', state);
    }, 10000);
  }
}, TICK_RATE);

io.on('connection', (socket) => {
  console.log('Player connected: ', socket.id);

  game.addPlayer(socket.id);
  game.resetGame();
  // send update to everyone
  io.emit('gameState', game.getState());

  socket.on('setPlayerName', (name) => {
    game.setPlayerName(socket.id, name);
    io.emit('gameState', game.getState());
  });

  socket.on('whack', (holeIndex) => {
    const points = game.handleWhack(socket.id, holeIndex);
    if (points !== 0) {
      const isExplosion = points < 0;
      // only confirm successful whack to player
      socket.emit('hitConfirmed', { index: holeIndex, points, isExplosion });

      // send everyone
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
