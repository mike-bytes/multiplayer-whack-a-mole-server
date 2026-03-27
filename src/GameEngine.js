import { NUM_HOLES, WINNING_SCORE, MOLE_DATA } from './constants/constants.js';

export class GameEngine {
  constructor() {
    this.activeMoles = [];
    this.moleLocked = new Set();

    this.players = {};
    this.lastWhackTime = {};

    this.nextSpawnTime = Date.now();
    this.winner = null;
  }

  addPlayer(id, name) {
    this.players[id] = {
      score: 0,
      name: name || 'guest',
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
    if (holeIndex < 0 || holeIndex >= NUM_HOLES) return 0;

    // prevent spam clicks
    const now = Date.now();
    if (
      this.lastWhackTime[playerId] &&
      now - this.lastWhackTime[playerId] < 100
    ) {
      return 0;
    }
    this.lastWhackTime[playerId] = now;

    const moleIndex = this.activeMoles.findIndex((m) => m.index === holeIndex);
    if (moleIndex === -1) return 0;

    if (this.moleLocked.has(holeIndex)) return 0;
    this.moleLocked.add(holeIndex);

    const item = this.activeMoles[moleIndex];
    const player = this.players[playerId];
    const points = MOLE_DATA[item.type]?.POINTS;
    player.score += points;
    if (player.score >= WINNING_SCORE) {
      this.winner = { id: playerId, name: player.name };
    }

    this.activeMoles.splice(moleIndex, 1);
    return points;
  }

  getState() {
    return {
      players: this.players,
      activeMoles: this.activeMoles,
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

    const count = Math.floor(Math.random() * 2 * this.getNumPlayers()) + 1;
    for (let i = 0; i < count; i++) {
      this.spawnMole(now);
    }

    const delay = 500 + Math.random() * 200;
    this.nextSpawnTime = now + delay;
  }

  spawnMole(now) {
    if (this.activeMoles.length >= 12) return;

    const index = Math.floor(Math.random() * NUM_HOLES);
    if (this.activeMoles.some((m) => m.index === index)) return;

    const itemType = this.getRandomItemType();
    let lifetime = 1500;
    if (itemType === MOLE_DATA.MOLE.TYPE) {
      lifetime = Math.random() * 1000 + 1500;
    } else if (
      itemType === MOLE_DATA.BOMB.TYPE ||
      itemType === MOLE_DATA.THUMBS_DOWN.TYPE
    ) {
      lifetime = 3000;
    }
    this.activeMoles.push({ index, type: itemType, expiresAt: now + lifetime });
    this.moleLocked.delete(index);
  }

  cleanupExpiredMoles(now) {
    this.activeMoles = this.activeMoles.filter((item) => now < item.expiresAt);
  }

  getRandomItemType() {
    const r = Math.random();
    switch (true) {
      case r < 0.1:
        return MOLE_DATA.STAR.TYPE;
      case r < 0.2:
        return MOLE_DATA.GRAPE.TYPE;
      case r < 0.3:
        return MOLE_DATA.BLUEBERRY.TYPE;
      case r < 0.4:
        return MOLE_DATA.LEMON.TYPE;
      case r < 0.5:
        return MOLE_DATA.BANANA.TYPE;
      case r < 0.65:
        return MOLE_DATA.THUMBS_DOWN.TYPE;
      case r < 0.8:
        return MOLE_DATA.BOMB.TYPE;
      default:
        return MOLE_DATA.MOLE.TYPE;
    }
  }

  resetGame() {
    this.activeMoles = [];
    this.moleLocked.clear();

    for (const id in this.players) {
      this.players[id].score = 0;
    }

    this.startTime = Date.now();
    this.nextSpawnTime = Date.now();
    this.winner = null;
  }

  getNumPlayers() {
    return Object.values(this.players).length;
  }
}
