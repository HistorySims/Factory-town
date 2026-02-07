// All components are plain data objects returned by factory functions

export function Position(col, row) {
  return {
    col, row,
    // Sub-tile position for smooth movement (0-1 within tile)
    x: col, y: row, // float position in tile coords
    prevX: col, prevY: row, // previous tick position for interpolation
  };
}

export function Velocity(speed = 0) {
  return { speed, dx: 0, dy: 0 };
}

export function Pathfinding() {
  return {
    path: [],      // array of {col, row}
    pathIndex: 0,
    targetCol: -1,
    targetRow: -1,
    stuck: false,
  };
}

export function Worker(homeCol, homeRow) {
  return {
    state: 'idle',
    homeCol, homeRow,
    workplaceId: null,   // entity id of factory/seat
    mood: 0.7,           // 0 = angry, 1 = happy
    wage: 0,
    workTimer: 0,
    idleTimer: 0,
    employed: false,
  };
}

export function Building(type, width = 1, height = 1) {
  return {
    type,
    width, height,
    workerSlots: 0,
    workersPresent: 0,
    active: true,
  };
}

export function Factory() {
  return {
    seats: 3,           // starting work seats
    filledSeats: 0,
    power: 0,
    maxPower: 3,        // from water wheels
    productionRate: 0,
    totalProduced: 0,
    wasteGenerated: 0,
    dumpingWaste: false,
  };
}

export function Warehouse() {
  return {
    shirts: 0,
    capacity: 200,
  };
}

export function WaterWheel() {
  return {
    power: 3,           // seats it can power
    angle: 0,
    active: true,
    efficiency: 1.0,    // degraded by pollution
  };
}

export function Cargo(type = 'shirts', capacity = 5) {
  return {
    type,
    carried: 0,
    capacity,
    loading: false,
    unloading: false,
  };
}

export function Transport(transportType) {
  return {
    type: transportType,
    state: 'idle',       // idle, loading, traveling, unloading, returning
    sourceId: null,
    destCol: -1,
    destRow: -1,
  };
}

export function Competitor(name) {
  return {
    name,
    wage: 4,
    price: 9,
    attractionRadius: 15,
    workersAbsorbed: 0,
    buyersAbsorbed: 0,
    pulsePhase: Math.random() * Math.PI * 2,
    strength: 0.5,
  };
}

export function Sprite(color, width = 1, height = 1, shape = 'rect') {
  return {
    color,
    width, height,
    shape,     // 'rect', 'circle', 'triangle'
    offsetY: 0,
  };
}

export function Pollution() {
  return {
    level: 0,  // 0-1
  };
}

export function Housing() {
  return {
    residents: 0,
    maxResidents: 4,
    spawnTimer: 0,
  };
}
