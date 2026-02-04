import { SCREEN_WIDTH, PLATFORM, DIFFICULTY, GAME } from './Constants';

export type PlatformType = 'NORMAL' | 'MOVING' | 'BREAKING' | 'SPRING';

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  broken: boolean;
  movingDirection: number; // 1 = right, -1 = left
  initialX: number; // For moving platforms
}

let platformIdCounter = 0;

function getDifficultySettings(height: number) {
  if (height < DIFFICULTY.EASY.maxHeight) return DIFFICULTY.EASY;
  if (height < DIFFICULTY.MEDIUM.maxHeight) return DIFFICULTY.MEDIUM;
  if (height < DIFFICULTY.HARD.maxHeight) return DIFFICULTY.HARD;
  return DIFFICULTY.EXTREME;
}

function selectPlatformType(height: number): PlatformType {
  const settings = getDifficultySettings(height);
  const rand = Math.random() * 100;

  let cumulative = settings.normalWeight;
  if (rand < cumulative) return 'NORMAL';

  cumulative += settings.movingWeight;
  if (rand < cumulative) return 'MOVING';

  cumulative += settings.breakingWeight;
  if (rand < cumulative) return 'BREAKING';

  return 'SPRING';
}

export function generatePlatform(yPosition: number, height: number = 0): Platform {
  const type = selectPlatformType(height);
  const width = PLATFORM.WIDTH;
  const x = Math.random() * (SCREEN_WIDTH - width);

  platformIdCounter++;

  return {
    id: `platform_${platformIdCounter}`,
    x,
    y: yPosition,
    width,
    height: PLATFORM.HEIGHT,
    type,
    broken: false,
    movingDirection: Math.random() > 0.5 ? 1 : -1,
    initialX: x,
  };
}

export function generateInitialPlatforms(startY: number, count: number): Platform[] {
  const platforms: Platform[] = [];
  const maxGap = GAME.MAX_JUMP_HEIGHT * 0.7; // Safe gap

  // First platform directly under player
  platforms.push({
    id: 'platform_start',
    x: SCREEN_WIDTH / 2 - PLATFORM.WIDTH / 2,
    y: startY,
    width: PLATFORM.WIDTH,
    height: PLATFORM.HEIGHT,
    type: 'NORMAL',
    broken: false,
    movingDirection: 1,
    initialX: SCREEN_WIDTH / 2 - PLATFORM.WIDTH / 2,
  });

  let currentY = startY;

  for (let i = 1; i < count; i++) {
    // Calculate gap based on progression
    const gap = GAME.MIN_PLATFORM_GAP + Math.random() * (maxGap - GAME.MIN_PLATFORM_GAP);
    currentY -= gap;

    const platform = generatePlatform(currentY, Math.abs(currentY));
    // Early platforms are always normal
    if (i < 5) {
      platform.type = 'NORMAL';
    }
    platforms.push(platform);
  }

  return platforms;
}

export function generateNewPlatform(highestY: number, currentHeight: number): Platform {
  const maxGap = GAME.MAX_JUMP_HEIGHT * 0.7;
  const gap = GAME.MIN_PLATFORM_GAP + Math.random() * (maxGap - GAME.MIN_PLATFORM_GAP);
  const newY = highestY - gap;

  return generatePlatform(newY, currentHeight);
}

export function resetPlatformCounter(): void {
  platformIdCounter = 0;
}
