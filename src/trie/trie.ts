export class TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;

  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEnd = true;
  }

  exists(word: string): boolean {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      const next = node.children.get(char);
      if (!next) return false;
      node = next;
    }
    return node.isEnd;
  }

  isPrefix(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      const next = node.children.get(char);
      if (!next) return false;
      node = next;
    }
    return true;
  }

  serialize(): any {
    const serializeNode = (node: TrieNode) => {
      const children: any = {};
      for (const [char, child] of node.children) {
        children[char] = serializeNode(child);
      }
      return {
        isEnd: node.isEnd,
        children,
      };
    };

    return serializeNode(this.root);
  }

  deserialize(data: any): void {
    const buildNode = (d: any): TrieNode => {
      const node = new TrieNode();
      node.isEnd = d.isEnd;
      for (const char in d.children) {
        node.children.set(char, buildNode(d.children[char]));
      }
      return node;
    };

    this.root = buildNode(data);
  }
}
