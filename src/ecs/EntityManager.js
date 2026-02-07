import { hasComponent, getComponent } from './Entity.js';

export class EntityManager {
  constructor() {
    this.entities = new Map(); // id -> entity
  }

  add(entity) {
    this.entities.set(entity.id, entity);
    return entity;
  }

  remove(id) {
    const e = this.entities.get(id);
    if (e) {
      e.alive = false;
      this.entities.delete(id);
    }
  }

  get(id) {
    return this.entities.get(id);
  }

  getAll() {
    return Array.from(this.entities.values());
  }

  // Query entities that have all specified components
  query(...componentNames) {
    const results = [];
    for (const entity of this.entities.values()) {
      if (!entity.alive) continue;
      let match = true;
      for (const name of componentNames) {
        if (!hasComponent(entity, name)) {
          match = false;
          break;
        }
      }
      if (match) results.push(entity);
    }
    return results;
  }

  // Get first entity matching components
  queryOne(...componentNames) {
    for (const entity of this.entities.values()) {
      if (!entity.alive) continue;
      let match = true;
      for (const name of componentNames) {
        if (!hasComponent(entity, name)) {
          match = false;
          break;
        }
      }
      if (match) return entity;
    }
    return null;
  }

  count(...componentNames) {
    let count = 0;
    for (const entity of this.entities.values()) {
      if (!entity.alive) continue;
      let match = true;
      for (const name of componentNames) {
        if (!hasComponent(entity, name)) {
          match = false;
          break;
        }
      }
      if (match) count++;
    }
    return count;
  }

  cleanup() {
    for (const [id, entity] of this.entities) {
      if (!entity.alive) {
        this.entities.delete(id);
      }
    }
  }
}
