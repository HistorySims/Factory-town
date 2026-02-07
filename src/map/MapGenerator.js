import { MAP_COLS, MAP_ROWS, TERRAIN } from '../core/Constants.js';
import { seededRandom } from '../utils/MathUtils.js';

export class MapGenerator {
  generate(tileMap, seed = 42) {
    const rand = seededRandom(seed);

    // 1. Fill with grass
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        tileMap.set(c, r, TERRAIN.GRASS);
      }
    }

    // 2. Carve a meandering river left to right
    const riverRow = Math.floor(MAP_ROWS * 0.45);
    let currentRow = riverRow;
    const riverWidth = 3;
    this.riverCenterRows = new Array(MAP_COLS);

    for (let c = 0; c < MAP_COLS; c++) {
      // Meander
      const drift = rand() * 3 - 1.5;
      currentRow += drift > 1 ? 1 : drift < -1 ? -1 : 0;
      currentRow = Math.max(5, Math.min(MAP_ROWS - 5, currentRow));
      this.riverCenterRows[c] = Math.round(currentRow);

      for (let w = -Math.floor(riverWidth / 2); w <= Math.floor(riverWidth / 2); w++) {
        const r = Math.round(currentRow) + w;
        if (r >= 0 && r < MAP_ROWS) {
          tileMap.set(c, r, TERRAIN.WATER);
        }
      }
    }

    // 3. Place factory compound on the north bank (above river)
    // Factory location: roughly center of map, just above river
    const factoryCol = Math.floor(MAP_COLS * 0.4);
    const factoryRow = this.riverCenterRows[factoryCol] - Math.floor(riverWidth / 2) - 5;

    this.factoryOrigin = { col: factoryCol, row: factoryRow };

    // Factory footprint (6x4 tiles)
    for (let dc = 0; dc < 6; dc++) {
      for (let dr = 0; dr < 4; dr++) {
        tileMap.set(factoryCol + dc, factoryRow + dr, TERRAIN.BUILDING);
      }
    }

    // 4. Lay roads
    // Main road running east-west above factory
    const roadRow = factoryRow - 2;
    for (let c = 5; c < MAP_COLS - 5; c++) {
      tileMap.set(c, roadRow, TERRAIN.ROAD);
    }

    // Road from factory entrance down to main road
    for (let r = roadRow; r <= factoryRow; r++) {
      tileMap.set(factoryCol - 1, r, TERRAIN.ROAD);
    }

    // Road south from factory to river (for warehouse access)
    const warehouseRoad = factoryCol + 3;
    for (let r = factoryRow + 4; r < this.riverCenterRows[warehouseRoad] - 1; r++) {
      tileMap.set(warehouseRoad, r, TERRAIN.ROAD);
    }

    // Cross road
    const crossRoadCol = factoryCol + 10;
    for (let r = 3; r < this.riverCenterRows[crossRoadCol] - 1; r++) {
      if (tileMap.get(crossRoadCol, r) === TERRAIN.GRASS) {
        tileMap.set(crossRoadCol, r, TERRAIN.ROAD);
      }
    }

    // Another cross road west
    const crossRoadCol2 = factoryCol - 8;
    for (let r = 3; r < this.riverCenterRows[crossRoadCol2] - 1; r++) {
      if (tileMap.get(crossRoadCol2, r) === TERRAIN.GRASS) {
        tileMap.set(crossRoadCol2, r, TERRAIN.ROAD);
      }
    }

    // Secondary road south of river
    const southRoadRow = this.riverCenterRows[Math.floor(MAP_COLS / 2)] + Math.floor(riverWidth / 2) + 3;
    for (let c = 10; c < MAP_COLS - 10; c++) {
      if (tileMap.get(c, southRoadRow) === TERRAIN.GRASS) {
        tileMap.set(c, southRoadRow, TERRAIN.ROAD);
      }
    }

    // Bridge across river
    const bridgeCol = factoryCol + 6;
    const bridgeStart = this.riverCenterRows[bridgeCol] - Math.floor(riverWidth / 2);
    const bridgeEnd = this.riverCenterRows[bridgeCol] + Math.floor(riverWidth / 2);
    for (let r = bridgeStart; r <= bridgeEnd; r++) {
      tileMap.set(bridgeCol, r, TERRAIN.BRIDGE);
    }
    // Connect bridge to roads
    for (let r = bridgeEnd + 1; r <= southRoadRow; r++) {
      if (tileMap.get(bridgeCol, r) === TERRAIN.GRASS) {
        tileMap.set(bridgeCol, r, TERRAIN.ROAD);
      }
    }

    // 5. Mark housing plots (grass tiles near roads, will be built by player)
    this.housingPlots = [];
    const plotOffsets = [
      { col: factoryCol - 4, row: roadRow - 2 },
      { col: factoryCol - 4, row: roadRow + 1 },
      { col: factoryCol + 8, row: roadRow - 2 },
      { col: factoryCol + 8, row: roadRow + 1 },
      { col: factoryCol - 7, row: roadRow - 2 },
      { col: factoryCol - 7, row: roadRow + 1 },
      { col: factoryCol + 12, row: roadRow - 2 },
      { col: factoryCol + 12, row: roadRow + 1 },
    ];
    for (const p of plotOffsets) {
      if (tileMap.inBounds(p.col, p.row) && tileMap.isWalkable(p.col, p.row)) {
        this.housingPlots.push(p);
      }
    }

    // 6. Competitor zones (map edges)
    this.competitorLocations = [
      { col: 3, row: roadRow, name: 'Western Mill' },
      { col: MAP_COLS - 5, row: roadRow, name: 'Eastern Works' },
    ];

    // Water wheel location (on river bank adjacent to factory)
    this.waterWheelLocation = {
      col: factoryCol + 2,
      row: this.riverCenterRows[factoryCol + 2] - Math.floor(riverWidth / 2) - 1,
    };

    // Warehouse location (between factory and river)
    this.warehouseLocation = {
      col: factoryCol + 3,
      row: factoryRow + 4,
    };

    // Scatter some grass variation (visual only, done in renderer)
    this.grassVariation = [];
    for (let i = 0; i < 200; i++) {
      this.grassVariation.push({
        col: Math.floor(rand() * MAP_COLS),
        row: Math.floor(rand() * MAP_ROWS),
      });
    }

    return {
      factoryOrigin: this.factoryOrigin,
      waterWheelLocation: this.waterWheelLocation,
      warehouseLocation: this.warehouseLocation,
      housingPlots: this.housingPlots,
      competitorLocations: this.competitorLocations,
      riverCenterRows: this.riverCenterRows,
      grassVariation: this.grassVariation,
      roadRow,
      southRoadRow,
    };
  }
}
