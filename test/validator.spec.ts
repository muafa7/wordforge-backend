import { Trie } from '../src/trie/trie';
import { validateWord } from '../src/game/validator';

const grid = [
  ['C', 'A', 'T', 'S'],
  ['D', 'O', 'G', 'H'],
  ['B', 'I', 'R', 'D'],
  ['L', 'I', 'O', 'N'],
];

function buildTrie() {
  const t = new Trie();
  ['cat', 'dog', 'bird', 'lion'].forEach(w => t.insert(w));
  return t;
}

describe('Word validator', () => {
  test('valid path CAT', () => {
    const trie = buildTrie();
    const path = [{r:0,c:0}, {r:0,c:1}, {r:0,c:2}];
    expect(validateWord(grid, path, trie)).toBe(true);
  });

  test('invalid non-adjacent', () => {
    const trie = buildTrie();
    const path = [{r:0,c:0}, {r:0,c:2}];
    expect(validateWord(grid, path, trie)).toBe(false);
  });

  test('invalid word not in Trie', () => {
    const trie = buildTrie();
    const path = [{r:0,c:0}, {r:0,c:1}, {r:0,c:3}];
    expect(validateWord(grid, path, trie)).toBe(false);
  });
});
