// Advanced Maze Generator - Creates complex, visually appealing mazes
// Uses recursive backtracking with larger grid for more intricate paths

export interface MazeConfig {
  rows: number;
  cols: number;
}

// Cell representation during generation
type Cell = {
  visited: boolean;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
};

const DIRECTIONS = [
  { row: -1, col: 0, wall: 'top' as const, opposite: 'bottom' as const },
  { row: 1, col: 0, wall: 'bottom' as const, opposite: 'top' as const },
  { row: 0, col: -1, wall: 'left' as const, opposite: 'right' as const },
  { row: 0, col: 1, wall: 'right' as const, opposite: 'left' as const },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createCellGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      visited: false,
      walls: { top: true, right: true, bottom: true, left: true },
    }))
  );
}

// Recursive backtracking - guarantees all cells are reachable
function carve(grid: Cell[][], row: number, col: number): void {
  grid[row][col].visited = true;
  const directions = shuffle([...DIRECTIONS]);

  for (const dir of directions) {
    const newRow = row + dir.row;
    const newCol = col + dir.col;

    if (
      newRow >= 0 &&
      newRow < grid.length &&
      newCol >= 0 &&
      newCol < grid[0].length &&
      !grid[newRow][newCol].visited
    ) {
      // Remove wall between current and next cell
      grid[row][col].walls[dir.wall] = false;
      grid[newRow][newCol].walls[dir.opposite] = false;
      carve(grid, newRow, newCol);
    }
  }
}

// Convert cell-based maze to number grid with thin walls
// 0 = path, 1 = wall, 2 = start, 3 = exit
function convertToNumberGrid(cells: Cell[][]): number[][] {
  const cellRows = cells.length;
  const cellCols = cells[0].length;
  const gridRows = cellRows * 2 + 1;
  const gridCols = cellCols * 2 + 1;

  // Initialize with all walls
  const grid: number[][] = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => 1)
  );

  // Carve paths based on cell walls
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      const cell = cells[r][c];
      const gridRow = r * 2 + 1;
      const gridCol = c * 2 + 1;

      // Cell center is always path
      grid[gridRow][gridCol] = 0;

      // Open passages based on removed walls
      if (!cell.walls.right && c < cellCols - 1) {
        grid[gridRow][gridCol + 1] = 0;
      }
      if (!cell.walls.bottom && r < cellRows - 1) {
        grid[gridRow + 1][gridCol] = 0;
      }
    }
  }

  // Set start (top-center) and exit (bottom-center)
  // Find a good start position at top
  const topPathCol = findPathInRow(grid, 1);
  grid[1][topPathCol] = 2; // Start

  // Find a good exit position at bottom
  const bottomPathCol = findPathInRow(grid, gridRows - 2);
  grid[gridRows - 2][bottomPathCol] = 3; // Exit

  return grid;
}

// Find a path cell in a specific row
function findPathInRow(grid: number[][], row: number): number {
  const cols = grid[0].length;
  const midCol = Math.floor(cols / 2);

  // Try to find path near center first
  for (let offset = 0; offset < cols; offset++) {
    const leftCol = midCol - offset;
    const rightCol = midCol + offset;

    if (leftCol >= 0 && grid[row][leftCol] === 0) return leftCol;
    if (rightCol < cols && grid[row][rightCol] === 0) return rightCol;
  }

  // Fallback to any path
  for (let c = 1; c < cols - 1; c++) {
    if (grid[row][c] === 0) return c;
  }

  return 1;
}

// Verify maze is solvable using BFS
function isSolvable(grid: number[][]): boolean {
  const rows = grid.length;
  const cols = grid[0].length;

  let start: { row: number; col: number } | null = null;
  let end: { row: number; col: number } | null = null;

  // Find start and end
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) start = { row: r, col: c };
      if (grid[r][c] === 3) end = { row: r, col: c };
    }
  }

  if (!start || !end) return false;

  // BFS
  const visited = new Set<string>();
  const queue: { row: number; col: number }[] = [start];
  visited.add(`${start.row},${start.col}`);

  const dirs = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.row === end.row && current.col === end.col) {
      return true;
    }

    for (const dir of dirs) {
      const newRow = current.row + dir.row;
      const newCol = current.col + dir.col;
      const key = `${newRow},${newCol}`;

      if (
        newRow >= 0 &&
        newRow < rows &&
        newCol >= 0 &&
        newCol < cols &&
        !visited.has(key) &&
        grid[newRow][newCol] !== 1
      ) {
        visited.add(key);
        queue.push({ row: newRow, col: newCol });
      }
    }
  }

  return false;
}

// Add some extra connections to create multiple paths (makes it more interesting)
function addExtraConnections(grid: number[][], percentage: number): void {
  const rows = grid.length;
  const cols = grid[0].length;
  const wallsToRemove = Math.floor((rows * cols * percentage) / 100);

  let removed = 0;
  let attempts = 0;
  const maxAttempts = wallsToRemove * 10;

  while (removed < wallsToRemove && attempts < maxAttempts) {
    attempts++;

    // Pick random wall (odd positions are cells, even positions can be walls between cells)
    const r = Math.floor(Math.random() * (rows - 2)) + 1;
    const c = Math.floor(Math.random() * (cols - 2)) + 1;

    if (grid[r][c] === 1) {
      // Check if removing this wall connects two path cells
      const neighbors = [
        { row: r - 1, col: c },
        { row: r + 1, col: c },
        { row: r, col: c - 1 },
        { row: r, col: c + 1 },
      ];

      const pathNeighbors = neighbors.filter(
        (n) =>
          n.row >= 0 &&
          n.row < rows &&
          n.col >= 0 &&
          n.col < cols &&
          grid[n.row][n.col] !== 1
      );

      // Only remove if it connects exactly 2 path cells (creates a shortcut)
      if (pathNeighbors.length === 2) {
        grid[r][c] = 0;
        removed++;
      }
    }
  }
}

export function generateMaze(difficulty: 'easy' | 'medium' | 'hard'): number[][] {
  let cellRows: number;
  let cellCols: number;
  let extraConnections: number;

  // Larger grids for more complex mazes like the reference image
  switch (difficulty) {
    case 'easy':
      cellRows = 8;
      cellCols = 8;
      extraConnections = 5; // More shortcuts for easier solving
      break;
    case 'medium':
      cellRows = 10;
      cellCols = 10;
      extraConnections = 3;
      break;
    case 'hard':
    default:
      cellRows = 12;
      cellCols = 12;
      extraConnections = 1; // Fewer shortcuts, more confusing
      break;
  }

  // Generate maze with guaranteed solution
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const cells = createCellGrid(cellRows, cellCols);

    // Start carving from a random position for variety
    const startRow = Math.floor(Math.random() * cellRows);
    const startCol = Math.floor(Math.random() * cellCols);
    carve(cells, startRow, startCol);

    const grid = convertToNumberGrid(cells);

    // Add some extra connections to create multiple paths
    addExtraConnections(grid, extraConnections);

    if (isSolvable(grid)) {
      return grid;
    }
    attempts++;
  }

  // Fallback: create simple solvable maze
  return createSimpleMaze(cellRows, cellCols);
}

// Fallback simple maze that's always solvable
function createSimpleMaze(cellRows: number, cellCols: number): number[][] {
  const gridRows = cellRows * 2 + 1;
  const gridCols = cellCols * 2 + 1;

  const grid: number[][] = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => 1)
  );

  // Create a simple snake path
  let row = 1;
  let col = 1;
  grid[row][col] = 2; // Start

  let direction = 1; // 1 = right, -1 = left

  while (row < gridRows - 2) {
    // Move horizontally
    while (
      (direction === 1 && col < gridCols - 2) ||
      (direction === -1 && col > 1)
    ) {
      grid[row][col] = grid[row][col] === 2 ? 2 : 0;
      col += direction;
      grid[row][col] = 0;
    }

    // Move down if not at bottom
    if (row < gridRows - 2) {
      row++;
      grid[row][col] = 0;
      if (row < gridRows - 2) {
        row++;
        grid[row][col] = 0;
      }
    }

    direction *= -1;
  }

  grid[gridRows - 2][gridCols - 2] = 3; // Exit

  return grid;
}

export function findStart(grid: number[][]): { row: number; col: number } {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 2) return { row: r, col: c };
    }
  }
  return { row: 1, col: 1 };
}

export function findExit(grid: number[][]): { row: number; col: number } {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 3) return { row: r, col: c };
    }
  }
  return { row: grid.length - 2, col: grid[0].length - 2 };
}
