import { Trie } from '../trie/trie';
import { Coord, isAdjacent } from './grid';

export function validateWord(
  grid: string[][],
  path: Coord[],
  trie: Trie
): boolean {
  if (!isAdjacent(path)) return false;

  let word = '';

  for (const { r, c } of path) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid.length) {
      return false;
    }
    word += grid[r][c].toLowerCase();
  }

  return trie.exists(word);
}
