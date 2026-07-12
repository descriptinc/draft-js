import {exportedForTesting} from '../useDraftEditorBlockWindowing';

const {getWindowRange} = exportedForTesting;

describe('getWindowRange', () => {
  const blockLayout = {
    keys: ['a', 'b', 'c'],
    offsets: [0, 10, 30],
    heights: new Map([
      ['a', 10],
      ['b', 20],
      ['c', 30],
    ]),
  };

  test('returns blocks intersecting the viewport', () => {
    expect(getWindowRange(blockLayout, 11, 29)).toEqual({start: 1, end: 2});
  });

  test('includes blocks touching either viewport boundary', () => {
    expect(getWindowRange(blockLayout, 10, 30)).toEqual({start: 0, end: 3});
  });

  test('handles a viewport after the content', () => {
    expect(getWindowRange(blockLayout, 100, 120)).toEqual({start: 3, end: 3});
  });
});
