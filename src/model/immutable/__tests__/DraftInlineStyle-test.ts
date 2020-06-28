import {inlineStyleWith, inlineStyleWithout} from '../DraftInlineStyle';

test('inlineStyleWith returns same set if it already contains the style', () => {
  const style = new Set('a');
  expect(inlineStyleWith(style, 'a')).toBe(style);
});

test('inlineStyleWith adds missing style', () => {
  expect(inlineStyleWith(new Set(['a']), 'b')).toEqual(new Set(['a', 'b']));
});

test('inlineStyleWithout returns same set if it does not contain the style', () => {
  const style = new Set(['a']);
  expect(inlineStyleWithout(style, 'b')).toBe(style);
});

test('inlineStyleWithout removes existing style', () => {
  expect(inlineStyleWithout(new Set(['a']), 'a')).toEqual(new Set([]));
});
