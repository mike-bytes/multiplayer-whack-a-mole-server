import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameEngine } from './GameEngine.js';
import { TICK_RATE } from './constants/constants.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const game = new GameEngine();

let countdownRunning = false;
const readyPlayers = new Set();

// game loop
setInterval(() => {
  game.update();
  const state = game.getState();
  io.emit('gameState', state);
}, TICK_RATE);

io.on('connection', (socket) => {
  // send update to person who connected
  socket.emit('gameState', game.getState());

  socket.on('addPlayer', (name) => {
    console.log('Player connected: ', socket.id);
    game.addPlayer(socket.id, name);

    // allow single player to just start on own
    if (game.getNumPlayers() === 2) {
      startCountdown();
    } else {
      readyPlayers.add(socket.id); // add the current player
      io.emit('newPlayer');
    }
  });

  socket.on('playerReady', () => {
    console.log('playerReady', socket.id);
    readyPlayers.add(socket.id);
    console.log(
      readyPlayers.size,
      'ready players of total players',
      game.getNumPlayers()
    );
    if (readyPlayers.size === game.getNumPlayers()) {
      readyPlayers.clear();
      startCountdown();
    }
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
    console.log('Player disconnected:', socket.id);
    readyPlayers.delete(socket.id);
    game.removePlayer(socket.id);
    io.emit('gameState', game.getState());
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const startCountdown = (duration = 5000) => {
  if (countdownRunning) return;
  countdownRunning = true;

  console.log('starting countdown with duration', duration);
  const endTime = Date.now() + duration;
  io.emit('startCountdown', endTime);

  setTimeout(() => {
    game.resetGame();
    countdownRunning = false;
    io.emit('gameState', game.getState());
  }, duration);
};
