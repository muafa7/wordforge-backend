import { Trie } from '../src/trie/trie';

describe('Trie', () => {
  let trie: Trie;

  beforeEach(() => {
    trie = new Trie();
  });

  test('insert + exists', () => {
    trie.insert('cat');
    trie.insert('dog');

    expect(trie.exists('cat')).toBe(true);
    expect(trie.exists('dog')).toBe(true);
    expect(trie.exists('car')).toBe(false);
  });

  test('prefix search', () => {
    trie.insert('apple');
    expect(trie.isPrefix('app')).toBe(true);
    expect(trie.isPrefix('apx')).toBe(false);
  });

  test('serialize + deserialize', () => {
    trie.insert('hello');
    trie.insert('helium');

    const data = trie.serialize();

    const t2 = new Trie();
    t2.deserialize(data);

    expect(t2.exists('hello')).toBe(true);
    expect(t2.exists('helium')).toBe(true);
  });
});
