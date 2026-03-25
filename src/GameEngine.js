import { NUM_HOLES } from './constants/constants.js';

export class GameEngine {
  constructor() {
    this.guestNum = 1;

    this.activeMoles = new Set();
    this.moleLocked = new Set();

    this.players = {};
    this.lastWhackTime = {};
    this.moleTimers = {};
  }

  spawnMole() {
    if (this.activeMoles.size >= 10) return;

    const index = Math.floor(Math.random() * (NUM_HOLES - 1)) + 1;
    if (!this.activeMoles.has(index)) {
      this.activeMoles.add(index);
    }
    this.moleLocked.delete(index);

    // remove moles after some time if they are not hit
    this.moleTimers[index] = setTimeout(() => {
      this.activeMoles.delete(index);
      delete this.moleTimers[index];
    }, 4000);
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
  }

  setPlayerName(id, name) {
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

    this.players[playerId].score++;

    this.activeMoles.delete(holeIndex);
    this.moleLocked.delete(holeIndex);
    return true;
  }

  getState() {
    return {
      players: this.players,
      activeMoles: [...this.activeMoles], // convert to array to serialize over socket
    };
  }
}
