export interface Position {
  x: number;
  y: number;
}

export interface BirdEntity {
  position: Position;
  velocity: number;
  renderer: React.ComponentType<any>;
}

export interface PipeEntity {
  position: { x: number };
  topHeight: number;
  bottomY: number;
  bottomHeight: number;
  scored: boolean;
  renderer: React.ComponentType<any>;
}

export interface GameEntities {
  bird: BirdEntity;
  [key: string]: BirdEntity | PipeEntity | any;
}

export interface GameEvent {
  type: string;
  velocity?: number;
}

export type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';
