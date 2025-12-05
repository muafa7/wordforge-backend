const LETTER_POINTS: Record<string, number> = {
  a: 1,b: 3,c: 3,d: 2,e: 1,f: 4,g: 2,h: 4,i: 1,j: 8,k: 5,l: 1,
  m: 3,n: 1,o: 1,p: 3,q:10,r: 1,s: 1,t: 1,u: 1,v: 4,w: 4,x: 8,y: 4,z:10,
};

function scoreByLength(word: string) {
  const n = word.length;
  if (n < 3) return 0;
  if (n === 3) return 1;
  if (n === 4) return 2;
  if (n === 5) return 4;
  if (n === 6) return 7;
  return 11;
}

export function scoreWord(word: string) {
  const base = scoreByLength(word);
  const letterBonus = [...word].reduce((sum, ch) => sum + (LETTER_POINTS[ch] ?? 0), 0);

  // Make bonus not overpower length scoring:
  // e.g. add only 25% of letter score, rounded down
  return base + Math.floor(letterBonus * 0.25);
}
