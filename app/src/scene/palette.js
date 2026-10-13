/* Палитра сцены.
   Отличие от первой версии: цвета приглушены и разведены по светлоте,
   а не по насыщенности. Плоские яркие цвета читались как пластик —
   теперь тон работает в паре с шероховатостью материала. */

export const FLOOR_H = 4.2;   // высота этажа (экстерьер)
export const FLOORS = 4;      // этажей в корпусе
export const BLD_H = FLOOR_H * FLOORS;

export const WALL_H = 2.9;    // внутренние перегородки (было 1.3 — читалось как макет)
export const DOOR_H = 2.1;
export const DOOR_W = 1.1;

/* Экстерьер — штукатурка песочного тона с переходами по светлоте */
export const EXT = {
  wall: '#d9c08a',
  wallWarm: '#e1c996',
  wallCool: '#c9ae7e',
  trim: '#b59a6f',
  plinth: '#3b3f47',
  plinthDark: '#2e3239',
  reveal: '#a8916b',
  frame: '#e8e2d4',
  glass: '#48688a',
  roofTop: '#8d8878',
  gold: '#c2952f',
};

/* Интерьер: помещения различаются светлотой */
export const INT = {
  slab: '#b9bec6',
  corridor: '#cfd3d8',
  corridorTrim: '#a9aeb6',
  classRoom: '#c6ccd8',
  adminRoom: '#d5cdb4',
  serviceRoom: '#c0ccc4',
  techRoom: '#cec3c4',
  lobbyRoom: '#d2cec4',
  outerWall: '#8e9199',
  innerWall: '#b4b8bf',
  wallCap: '#9aa0a8',
  glass: '#7fa3c0',
  roof: '#6f7784',
  exit: '#1c6b45',
  fire: '#98262f',
  electric: '#a8811f',
  stairs: '#9ea3ab',
  route: '#2f6be0',
  door: '#8b7355',
  doorFrame: '#c8c2b4',
};

/* Благоустройство — приглушённая зелень, без «травяного» неона */
export const SITE = {
  trunkDark: '#4a3826',
  trunk: '#5d4630',
  leafDeep: '#3c5b3a',
  leafMid: '#4a6e45',
  leafLight: '#5c8250',
  lawn: '#728a5c',
  lawnDry: '#8a9668',
  path: '#c8c6bf',
  pathEdge: '#b0aea6',
  asphalt: '#7e838a',
  ground: '#9aa382',
  plaza: '#b4b7ba',
};

export const SKY = '#c3d2e2';
