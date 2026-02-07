import { createEntity, addComponent } from '../ecs/Entity.js';
import * as C from '../ecs/Component.js';
import { COLORS, BASE_WALK_SPEED, CART_SPEED, BARGE_SPEED, TRAIN_SPEED,
         CART_CAPACITY, BARGE_CAPACITY, TRAIN_CAPACITY, TRANSPORT_TYPE } from '../core/Constants.js';

export function createWorker(entityManager, col, row, homeCol, homeRow) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'velocity', C.Velocity(BASE_WALK_SPEED));
  addComponent(e, 'pathfinding', C.Pathfinding());
  addComponent(e, 'worker', C.Worker(homeCol, homeRow));
  addComponent(e, 'sprite', C.Sprite(COLORS.WORKER_HAPPY, 0.5, 0.5, 'circle'));

  entityManager.add(e);
  return e;
}

export function createCart(entityManager, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'velocity', C.Velocity(CART_SPEED));
  addComponent(e, 'pathfinding', C.Pathfinding());
  addComponent(e, 'cargo', C.Cargo('shirts', CART_CAPACITY));
  addComponent(e, 'transport', C.Transport(TRANSPORT_TYPE.CART));
  addComponent(e, 'sprite', C.Sprite(COLORS.CART, 0.8, 0.5, 'rect'));

  entityManager.add(e);
  return e;
}

export function createBarge(entityManager, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'velocity', C.Velocity(BARGE_SPEED));
  addComponent(e, 'pathfinding', C.Pathfinding());
  addComponent(e, 'cargo', C.Cargo('shirts', BARGE_CAPACITY));
  addComponent(e, 'transport', C.Transport(TRANSPORT_TYPE.BARGE));
  addComponent(e, 'sprite', C.Sprite(COLORS.BARGE, 1.2, 0.6, 'rect'));

  entityManager.add(e);
  return e;
}

export function createTrain(entityManager, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'velocity', C.Velocity(TRAIN_SPEED));
  addComponent(e, 'pathfinding', C.Pathfinding());
  addComponent(e, 'cargo', C.Cargo('shirts', TRAIN_CAPACITY));
  addComponent(e, 'transport', C.Transport(TRANSPORT_TYPE.TRAIN));
  addComponent(e, 'sprite', C.Sprite(COLORS.TRAIN, 1.5, 0.6, 'rect'));

  entityManager.add(e);
  return e;
}
