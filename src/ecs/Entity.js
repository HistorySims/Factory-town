let nextId = 1;

export function createEntity() {
  return {
    id: nextId++,
    components: new Map(),
    alive: true,
  };
}

export function addComponent(entity, name, data) {
  entity.components.set(name, data);
  return entity;
}

export function getComponent(entity, name) {
  return entity.components.get(name);
}

export function hasComponent(entity, name) {
  return entity.components.has(name);
}

export function removeComponent(entity, name) {
  entity.components.delete(name);
}
