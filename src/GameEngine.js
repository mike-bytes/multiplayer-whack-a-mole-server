export class GameEngine {
  constructor() {
    this.players = {};
    this.activeMole = null;
    this.spawnInterval = null;
    this.guestNum = 1;
    this.moleLocked = false;
  }

  spawnMole() {
    this.activeMole = Math.floor(Math.random() * 8) + 1;
    this.moleLocked = false;
  }

  addPlayer(id) {
    this.guestNum = this.guestNum % 10;
    const defaultName = `Guest${this.guestNum}`;

    this.players[id] = {
      score: 0,
      name: defaultName,
    };
  }

  getPlayers() {
    return this.players;
  }

  removePlayer(id) {
    delete this.players[id];
  }

  setPlayerName(id, name) {
    this.players[id].name = name;
  }

  handleWhack(playerId, holeIndex) {
    console.log(holeIndex, this.activeMole);
    if (this.moleLocked) {
      console.log('mole locked');
      return false;
    }
    if (holeIndex === this.activeMole) {
      this.moleLocked = true;
      this.players[playerId].score += 1;
      return true;
    }
    return false;
  }

  getState() {
    return {
      players: this.players,
      activeMole: this.activeMole,
    };
  }
}
