import { NUM_HOLES, WINNING_SCORE, ITEMS } from './constants/constants.js';

export class GameEngine {
  constructor() {
    this.guestNum = 1;

    this.activeItems = [];
    this.moleLocked = new Set();

    this.players = {};
    this.lastWhackTime = {};

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

    const moleIndex = this.activeItems.findIndex((m) => m.index === holeIndex);
    if (moleIndex === -1) return 0;

    if (this.moleLocked.has(holeIndex)) return 0;
    this.moleLocked.add(holeIndex);

    const item = this.activeItems[moleIndex];
    const player = this.players[playerId];
    let points = 0;
    switch (item.type) {
      case ITEMS.STAR.TYPE: {
        points = ITEMS.STAR.POINTS;
        break;
      }
      case ITEMS.MOLE.TYPE: {
        points = ITEMS.MOLE.POINTS;
        break;
      }
      case ITEMS.BOMB.TYPE: {
        points = ITEMS.BOMB.POINTS;
        break;
      }
    }
    player.score += points;
    if (player.score >= WINNING_SCORE) {
      this.winner = { id: playerId, name: player.name };
    }

    this.activeItems.splice(moleIndex, 1);
    return points;
  }

  getState() {
    return {
      players: this.players,
      activeItems: this.activeItems,
      winner: this.winner,
    };
  }

  update() {
    if (this.winner) return;

    const now = Date.now();
    this.spawnItems(now);
    this.cleanupExpiredMoles(now);
  }

  spawnItems(now) {
    if (now < this.nextSpawnTime) return;

    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      this.spawnItem(now);
    }

    const delay = 500;
    this.nextSpawnTime = now + delay;
  }

  spawnItem(now) {
    if (this.activeItems.length >= 10) return;

    const index = Math.floor(Math.random() * NUM_HOLES);

    if (this.activeItems.some((m) => m.index === index)) return;

    const itemType = this.getRandomItemType();
    this.activeItems.push({ index, type: itemType, expiresAt: now + 3000 });

    this.moleLocked.delete(index);
  }

  cleanupExpiredMoles(now) {
    this.activeItems = this.activeItems.filter((item) => now < item.expiresAt);
  }

  getRandomItemType() {
    const r = Math.random();
    let itemType = ITEMS.MOLE.TYPE;
    if (r < 0.25) itemType = ITEMS.BOMB.TYPE; // 15%
    if (r < 0.1) itemType = ITEMS.STAR.TYPE; // 10%
    return itemType;
  }

  resetGame() {
    this.activeItems = [];
    this.moleLocked.clear();

    for (const id in this.players) {
      this.players[id].score = 0;
    }

    this.startTime = Date.now();
    this.nextSpawnTime = Date.now();
    this.winner = null;
  }
}
