import { scoreWord } from '../src/game/scoring';

describe('scoreWord', () => {
    test('word shorter than 3 letters has base score 0 (letter bonus still applies)', () => {
        // 'a'  = a(1), floor(1*0.25) = 0, base = 0 → total 0
        expect(scoreWord('a')).toBe(0);
        // 'ab' = a(1)+b(3) = 4, floor(4*0.25) = 1, base = 0 → total 1
        expect(scoreWord('ab')).toBe(1);
    });

    test('3-letter word scores 1 + letter bonus', () => {
        // 'cat' = c(3) + a(1) + t(1) = letterBonus 5, floor(5 * 0.25) = 1, base = 1 → total 2
        expect(scoreWord('cat')).toBe(2);
    });

    test('4-letter word scores 2 + letter bonus', () => {
        // 'cats' = c(3)+a(1)+t(1)+s(1) = 6, floor(6*0.25) = 1, base = 2 → total 3
        expect(scoreWord('cats')).toBe(3);
    });

    test('5-letter word scores 4 + letter bonus', () => {
        // 'birds' = b(3)+i(1)+r(1)+d(2)+s(1) = 8, floor(8*0.25) = 2, base = 4 → total 6
        expect(scoreWord('birds')).toBe(6);
    });

    test('6-letter word scores 7 + letter bonus', () => {
        // 'quartz' = q(10)+u(1)+a(1)+r(1)+t(1)+z(10) = 24, floor(24*0.25) = 6, base = 7 → total 13
        expect(scoreWord('quartz')).toBe(13);
    });

    test('7+ letter word scores 11 + letter bonus', () => {
        // 'puzzles' = p(3)+u(1)+z(10)+z(10)+l(1)+e(1)+s(1) = 27, floor(27*0.25) = 6, base = 11 → total 17
        expect(scoreWord('puzzles')).toBe(17);
    });

    test('high-value letters (q, z) contribute correctly to bonus', () => {
        // 'qua' = q(10)+u(1)+a(1) = 12, floor(12*0.25) = 3, base = 1 → total 4
        expect(scoreWord('qua')).toBe(4);
    });

    test('unknown characters default to 0 letter bonus', () => {
        // If a character has no entry in LETTER_POINTS it defaults to 0
        const score = scoreWord('aaa');
        // a(1)+a(1)+a(1) = 3, floor(3*0.25) = 0, base = 1 → total 1
        expect(score).toBe(1);
    });
});
