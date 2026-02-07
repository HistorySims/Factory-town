export const TILE_SIZE = 24;
export const MAP_COLS = 80;
export const MAP_ROWS = 50;
export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;

// Terrain types
export const TERRAIN = {
  GRASS: 0,
  WATER: 1,
  ROAD: 2,
  BUILDING: 3,
  RAIL: 4,
  CANAL: 5,
  BRIDGE: 6,
};

// Building types
export const BUILDING_TYPE = {
  FACTORY: 'factory',
  HOUSING: 'housing',
  WAREHOUSE: 'warehouse',
  WATER_WHEEL: 'waterWheel',
  WORK_SEAT: 'workSeat',
  COMPETITOR: 'competitor',
  STATION: 'station',
};

// Worker states
export const WORKER_STATE = {
  IDLE: 'idle',
  SEEKING_JOB: 'seekingJob',
  WALKING_TO_WORK: 'walkingToWork',
  WORKING: 'working',
  WALKING_HOME: 'walkingHome',
  PROTESTING: 'protesting',
};

// Transport types
export const TRANSPORT_TYPE = {
  CART: 'cart',
  BARGE: 'barge',
  TRAIN: 'train',
};

// Game phases
export const PHASE = {
  EARLY: 'early',
  MID: 'mid',
  LATE: 'late',
};

// Economy defaults
export const DEFAULT_WAGE = 5;
export const DEFAULT_PRICE = 10;
export const MAX_WAGE = 20;
export const MIN_WAGE = 1;
export const MAX_PRICE = 30;
export const MIN_PRICE = 1;
export const STARTING_MONEY = 100;

// Production
export const SHIRTS_PER_WORKER_TICK = 0.005; // per game tick when working
export const POWER_PER_WHEEL = 3; // seats a single wheel can power
export const WAREHOUSE_CAPACITY = 200;

// Workers
export const BASE_WALK_SPEED = 0.03; // tiles per tick
export const WORKER_SPAWN_INTERVAL = 300; // ticks between housing spawns (early)
export const MAX_WORKERS_PER_HOUSING = 4;

// Transport
export const CART_CAPACITY = 5;
export const BARGE_CAPACITY = 15;
export const TRAIN_CAPACITY = 50;
export const CART_SPEED = 0.04;
export const BARGE_SPEED = 0.05;
export const TRAIN_SPEED = 0.08;
export const CART_SPAWN_INTERVAL = 400;

// Pollution
export const POLLUTION_PER_PRODUCTION = 0.001;
export const POLLUTION_DECAY = 0.0001;
export const POLLUTION_DUMP_RATE = 0.02;
export const MAX_POLLUTION = 1.0;

// Unrest
export const UNREST_WAGE_THRESHOLD = 3; // wages below this raise unrest
export const UNREST_DENSITY_THRESHOLD = 8; // workers per region
export const MEETING_UNREST_THRESHOLD = 0.4;

// Phase transitions
export const MID_PHASE_PRODUCTION = 50; // total shirts produced
export const LATE_PHASE_PRODUCTION = 300;
export const MID_PHASE_POPULATION = 15;
export const LATE_PHASE_POPULATION = 40;

// Colors
export const COLORS = {
  GRASS: '#4a7a3a',
  GRASS_ALT: '#3d6e2f',
  WATER_CLEAN: '#3a6fb5',
  WATER_POLLUTED: '#6b5a30',
  ROAD: '#8a7d60',
  ROAD_MARKING: '#9a8d70',
  RAIL: '#555555',
  RAIL_TIE: '#8b7355',
  FACTORY_WALL: '#6b5040',
  FACTORY_ROOF: '#4a3528',
  HOUSING: '#7a6a50',
  HOUSING_ROOF: '#5a4a38',
  WAREHOUSE: '#5a6a50',
  WATER_WHEEL: '#6b5040',
  WORK_SEAT: '#888060',
  WORKER_HAPPY: '#60b848',
  WORKER_NEUTRAL: '#c8b040',
  WORKER_ANGRY: '#c84040',
  CART: '#8a7050',
  BARGE: '#5a4a3a',
  TRAIN: '#3a3a3a',
  COMPETITOR: '#3a2828',
  SMOKE: 'rgba(60, 55, 50, 0.3)',
  CANAL: '#4a80a0',
  STATION: '#4a4040',
};
