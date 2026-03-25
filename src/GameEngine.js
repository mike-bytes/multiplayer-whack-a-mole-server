import { NUM_HOLES, WINNING_SCORE } from './constants/constants.js';

export class GameEngine {
  constructor() {
    this.guestNum = 1;

    this.activeMoles = new Set();
    this.moleLocked = new Set();

    this.players = {};
    this.lastWhackTime = {};
    this.moleTimers = {};

    this.nextSpawnTime = Date.now();
    this.winner = null;
  }

  addPlayer(id) {
    this.guestNum = (this.guestNum + 1) % 10;
    const defaultName = `Guest${this.guestNum}`;

    this.players[id] = {
      score: 0,
      name: defaultName,
    };
  }

  removePlayer(id) {
    delete this.players[id];
    delete this.lastWhackTime[id];
  }

  setPlayerName(id, name) {
    if (!this.players[id]) return;
    this.players[id].name = name;
  }

  handleWhack(playerId, holeIndex) {
    if (holeIndex < 1 || holeIndex > NUM_HOLES) return false;

    // prevent spam clicks
    const now = Date.now();
    if (
      this.lastWhackTime[playerId] &&
      now - this.lastWhackTime[playerId] < 100
    ) {
      return false;
    }
    this.lastWhackTime[playerId] = now;

    if (!this.activeMoles.has(holeIndex)) return false;

    if (this.moleLocked.has(holeIndex)) return false;

    this.moleLocked.add(holeIndex);

    const player = this.players[playerId];
    player.score++;
    if (player.score >= WINNING_SCORE) {
      this.winner = { id: playerId, name: player.name };
    }
    
    this.activeMoles.delete(holeIndex);
    delete this.moleTimers[holeIndex];

    this.moleLocked.delete(holeIndex);
    return true;
  }

  getState() {
    return {
      players: this.players,
      activeMoles: [...this.activeMoles], // convert to array to serialize over socket
      winner: this.winner,
    };
  }

  update() {
    if (this.winner) return;

    const now = Date.now();
    this.spawnMoles(now);
    this.cleanupExpiredMoles(now);
  }

  spawnMoles(now) {
    if (now < this.nextSpawnTime) return;

    const count = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < count; i++) {
      this.spawnMole(now);
    }

    const delay = 500;
    this.nextSpawnTime = now + delay;
  }

  spawnMole(now) {
    if (this.activeMoles.size >= 10) return;

    const index = Math.floor(Math.random() * (NUM_HOLES - 1)) + 1;
    if (this.activeMoles.has(index)) return;

    this.activeMoles.add(index);
    this.moleLocked.delete(index);

    // remove moles after some time if they are not hit
    const lifetime = 3000;
    this.moleTimers[index] = now + lifetime;
  }

  cleanupExpiredMoles(now) {
    for (const holeIndex of this.activeMoles) {
      if (now >= this.moleTimers[holeIndex]) {
        this.activeMoles.delete(holeIndex);
        delete this.moleTimers[holeIndex];
      }
    }
  }

  resetGame() {
    this.activeMoles.clear();
    this.moleLocked.clear();
    this.moleExpireTimes = {};

    for (const id in this.players) {
      this.players[id].score = 0;
    }

    this.startTime = Date.now();
    this.nextSpawnTime = Date.now();
    this.winner = null;
  }
}
