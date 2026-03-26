import { describe, it, expect } from 'vitest';
import { GameEngine } from '../GameEngine.js';

describe('GameEngine', () => {
  it('adds a player with default name and score', () => {
    const engine = new GameEngine();
    engine.addPlayer('p1');

    expect(engine.players['p1']).toBeDefined();
    expect(engine.players['p1'].score).toBe(0);
    expect(engine.players['p1'].name).toMatch(/Guest/);
  });

  it('awards points when a mole is hit', () => {
    const engine = new GameEngine();
    engine.addPlayer('p1');
    engine.activeItems = [
      { index: 2, type: 'mole', expiresAt: Date.now() + 1000 },
    ];
    const points = engine.handleWhack('p1', 2);

    expect(points).toBeGreaterThan(0);
    expect(engine.players['p1'].score).toBe(points);
    expect(engine.activeItems.length).toBe(0);
  });

  it('adds a player with default name and score', () => {
    const engine = new GameEngine();
    engine.addPlayer('p1');

    expect(engine.players['p1']).toBeDefined();
    expect(engine.players['p1'].score).toBe(0);
    expect(engine.players['p1'].name).toMatch(/Guest/);
  });

  it('removes expired items', () => {
    const engine = new GameEngine();
    engine.activeItems = [
      { index: 1, type: 'mole', expiresAt: Date.now() - 100 },
    ];
    engine.cleanupExpiredMoles(Date.now());

    expect(engine.activeItems.length).toBe(0);
  });

  it('declares winner when score reaches winning score', () => {
    const engine = new GameEngine();
    engine.addPlayer('p1');
    engine.activeItems = [
      { index: 0, type: 'star', expiresAt: Date.now() + 1000 },
    ];
    engine.players['p1'].score = 49;
    engine.handleWhack('p1', 0);

    expect(engine.winner).not.toBeNull();
    expect(engine.winner.id).toBe('p1');
  });

  it('spawns items when spawn time reached', () => {
    const engine = new GameEngine();
    engine.spawnItems(Date.now());

    expect(engine.activeItems.length).toBeGreaterThan(0);
  });

  it('prevents spam clicking', () => {
    const engine = new GameEngine();
    engine.addPlayer('p1');
    engine.activeItems = [
      { index: 1, type: 'mole', expiresAt: Date.now() + 1000 },
    ];
    const first = engine.handleWhack('p1', 1);
    const second = engine.handleWhack('p1', 1);

    expect(first).toBeGreaterThan(0);
    expect(second).toBe(0);
  });

  it('only allows one player to score the same mole', () => {
    const engine = new GameEngine();
    engine.addPlayer('p1');
    engine.addPlayer('p2');
    engine.activeItems = [
      { index: 3, type: 'mole', expiresAt: Date.now() + 1000 },
    ];
    const p1Points = engine.handleWhack('p1', 3);
    const p2Points = engine.handleWhack('p2', 3);
    const totalScore = engine.players['p1'].score + engine.players['p2'].score;

    expect(totalScore).toBe(p1Points);
    expect(p2Points).toBe(0);
  });

  it('does not spawn two items in the same hole', () => {
    const engine = new GameEngine();
    engine.activeItems = [
      { index: 5, type: 'mole', expiresAt: Date.now() + 1000 },
    ];
    for (let i = 0; i < 20; i++) {
      engine.spawnItem(Date.now());
    }
    const indexes = engine.activeItems.map((i) => i.index);
    const unique = new Set(indexes);

    expect(indexes.length).toBe(unique.size);
  });
});
