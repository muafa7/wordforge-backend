export type Coord = { row: number; col: number };

export function generateGrid(n: number): string[][] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const grid: string[][] = [];

  for (let i = 0; i < n; i++) {
    const row: string[] = [];
    for (let j = 0; j < n; j++) {
      row.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    grid.push(row);
  }

  return grid;
}

export function areNeighbors(a: Coord, b: Coord): boolean {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1 &&
         !(a.row === b.row && a.col === b.col);
}

export function isAdjacent(path: Coord[]): boolean {
  for (let i = 1; i < path.length; i++) {
    if (!areNeighbors(path[i - 1], path[i])) {
      return false;
    }
  }
  return true;
}
