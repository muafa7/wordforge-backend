import { Trie } from '../trie/trie';
import { Coord, isAdjacent } from './grid';

export function validateWord(
  grid: string[][],
  path: Coord[],
  trie: Trie
): boolean {
  if (!isAdjacent(path)) return false;

  let word = '';

  for (const { row, col } of path) {
    if (row < 0 || row >= grid.length || col < 0 || col >= grid.length) {
      return false;
    }
    word += grid[row][col].toLowerCase();
  }

  return trie.exists(word);
}
