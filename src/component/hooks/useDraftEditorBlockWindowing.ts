import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {EditorState} from '../../model/immutable/EditorState';
import {BlockNode} from '../../model/immutable/BlockNode';
import {DraftEditorBlockWindowingOptions} from '../base/DraftEditorProps';

type BlockMeasurement = {
  height: number;
};

type BlockLayout = {
  keys: string[];
  offsets: number[];
  heights: Map<string, number>;
};

export type DraftEditorBlockWindowingState = {
  shouldRenderBlock: (block: BlockNode) => boolean;
  getSpacerHeight: (block: BlockNode) => number;
};

type UseDraftEditorBlockWindowingOptions = DraftEditorBlockWindowingOptions & {
  editorState: EditorState;
  editorContainerRef: RefObject<HTMLElement>;
  layoutKey?: unknown;
};

function haveEqualLayout(
  previous: ReadonlyMap<string, BlockMeasurement>,
  next: ReadonlyMap<string, BlockMeasurement>,
): boolean {
  if (previous.size !== next.size) {
    return false;
  }
  const previousEntries = previous.entries();
  for (const [nextKey, nextMeasurement] of next) {
    const previousEntry = previousEntries.next();
    if (
      previousEntry.done ||
      previousEntry.value[0] !== nextKey ||
      previousEntry.value[1].height !== nextMeasurement.height
    ) {
      return false;
    }
  }
  return true;
}

function getWindowRange(
  blockLayout: BlockLayout,
  viewportStart: number,
  viewportEnd: number,
): {start: number; end: number} {
  let start = 0;
  while (start < blockLayout.keys.length) {
    const blockKey = blockLayout.keys[start];
    const blockOffset = blockLayout.offsets[start];
    if (
      blockKey === undefined ||
      blockOffset === undefined ||
      blockOffset + (blockLayout.heights.get(blockKey) || 0) >= viewportStart
    ) {
      break;
    }
    start += 1;
  }

  let end = start;
  while (end < blockLayout.keys.length) {
    const blockOffset = blockLayout.offsets[end];
    if (blockOffset === undefined || blockOffset > viewportEnd) {
      break;
    }
    end += 1;
  }
  return {start, end};
}

function measureBlocks(
  blocks: ReadonlyMap<string, BlockNode>,
  previousMeasurements: ReadonlyMap<string, BlockMeasurement>,
): Map<string, BlockMeasurement> {
  const measurements = new Map<string, BlockMeasurement>();
  const lastBlockKey = Array.from(blocks.keys()).pop();
  for (const block of blocks.values()) {
    const element = document.getElementById(`block-${block.key}`);
    if (element) {
      const marginBottom =
        block.key === lastBlockKey
          ? 0
          : parseFloat(getComputedStyle(element).marginBottom) || 0;
      measurements.set(block.key, {
        height: element.getBoundingClientRect().height + marginBottom,
      });
      continue;
    }

    const previousMeasurement = previousMeasurements.get(block.key);
    if (previousMeasurement) {
      measurements.set(block.key, previousMeasurement);
    }
  }
  return measurements;
}

function getBlockLayout(
  blocks: ReadonlyMap<string, BlockNode>,
  measurements: ReadonlyMap<string, BlockMeasurement>,
): BlockLayout | undefined {
  const blockEntries = Array.from(blocks.entries());
  const retainedHeights = blockEntries
    .map(([key]) => measurements.get(key)?.height)
    .filter((height): height is number => height !== undefined);
  if (blockEntries.length > 0 && retainedHeights.length === 0) {
    return undefined;
  }

  const sortedHeights = Array.from(measurements.values(), ({height}) => height).sort(
    (a, b) => a - b,
  );
  const fallbackHeight = sortedHeights[Math.floor(sortedHeights.length / 2)] || 0;
  const nextMeasuredHeights: Array<number | undefined> = new Array(
    blockEntries.length,
  );
  let nextMeasuredHeight: number | undefined;
  for (let index = blockEntries.length - 1; index >= 0; index -= 1) {
    const blockEntry = blockEntries[index];
    const measuredHeight = blockEntry
      ? measurements.get(blockEntry[0])?.height
      : undefined;
    if (measuredHeight !== undefined) {
      nextMeasuredHeight = measuredHeight;
    }
    nextMeasuredHeights[index] = nextMeasuredHeight;
  }

  const keys: string[] = [];
  const offsets: number[] = [];
  const heights = new Map<string, number>();
  let offset = 0;
  let previousMeasuredHeight: number | undefined;
  for (const [index, [key]] of blockEntries.entries()) {
    const measuredHeight = measurements.get(key)?.height;
    const nextHeight = nextMeasuredHeights[index];
    const height =
      measuredHeight ??
      (previousMeasuredHeight !== undefined && nextHeight !== undefined
        ? (previousMeasuredHeight + nextHeight) / 2
        : previousMeasuredHeight ?? nextHeight ?? fallbackHeight);
    keys.push(key);
    offsets.push(offset);
    heights.set(key, height);
    offset += height;
    if (measuredHeight !== undefined) {
      previousMeasuredHeight = measuredHeight;
    }
  }
  return {keys, offsets, heights};
}

export function useDraftEditorBlockWindowing({
  enabled,
  editorState,
  scrollContainerRef,
  editorContainerRef,
  layoutKey,
  pinnedBlockKeys,
}: UseDraftEditorBlockWindowingOptions):
  | DraftEditorBlockWindowingState
  | undefined {
  const blockMap = editorState.currentContent.blockMap;
  const measurementsRef = useRef<ReadonlyMap<string, BlockMeasurement>>(new Map());
  const measuredWidthRef = useRef<number>();
  const [measurements, setMeasurements] = useState<
    ReadonlyMap<string, BlockMeasurement>
  >(new Map());
  const [measurementRevision, setMeasurementRevision] = useState(0);
  const [windowRange, setWindowRange] = useState<{start: number; end: number}>();

  const updateMeasurements = useCallback(() => {
    const nextMeasurements = measureBlocks(blockMap, measurementsRef.current);
    measurementsRef.current = nextMeasurements;
    setMeasurements(previousMeasurements =>
      haveEqualLayout(previousMeasurements, nextMeasurements)
        ? previousMeasurements
        : nextMeasurements,
    );
    return nextMeasurements.size === blockMap.size;
  }, [blockMap]);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    const animationFrame = requestAnimationFrame(() => {
      updateMeasurements();
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled, layoutKey, measurementRevision, updateMeasurements]);

  useLayoutEffect(() => {
    if (!enabled || measurements.size >= blockMap.size || !windowRange) {
      return;
    }
    const animationFrame = requestAnimationFrame(() => {
      updateMeasurements();
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [blockMap.size, enabled, measurements.size, updateMeasurements, windowRange]);

  useEffect(() => {
    const editorContainer = editorContainerRef.current;
    if (!enabled || !editorContainer || typeof ResizeObserver === 'undefined') {
      return;
    }
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width === undefined) {
        return;
      }
      const previousWidth = measuredWidthRef.current;
      measuredWidthRef.current = width;
      if (previousWidth === undefined || width === previousWidth) {
        return;
      }
      measurementsRef.current = new Map();
      setMeasurements(new Map());
      setMeasurementRevision(revision => revision + 1);
    });
    resizeObserver.observe(editorContainer);
    return () => {
      measuredWidthRef.current = undefined;
      resizeObserver.disconnect();
    };
  }, [editorContainerRef, enabled]);

  const blockLayout = useMemo<BlockLayout | undefined>(() => {
    if (!enabled) {
      return undefined;
    }
    return getBlockLayout(blockMap, measurements);
  }, [blockMap, enabled, measurements]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const editorContainer = editorContainerRef.current;
    if (!blockLayout || !scrollContainer || !editorContainer) {
      return;
    }
    const contents = editorContainer.querySelector<HTMLElement>('[data-contents="true"]');
    if (!contents) {
      return;
    }
    const scrollRect = scrollContainer.getBoundingClientRect();
    const contentsRect = contents.getBoundingClientRect();
    const contentOffset = contentsRect.top - scrollRect.top + scrollContainer.scrollTop;
    const viewportHeight = scrollContainer.clientHeight;
    const overscan = Math.max(viewportHeight * 1.5, 1200);

    let animationFrame: number | undefined;
    const updateWindow = () => {
      animationFrame = undefined;
      const viewportStart = scrollContainer.scrollTop - contentOffset - overscan;
      const viewportEnd = viewportStart + viewportHeight + overscan * 2;
      const nextRange = getWindowRange(blockLayout, viewportStart, viewportEnd);
      setWindowRange(previousRange =>
        previousRange?.start === nextRange.start && previousRange.end === nextRange.end
          ? previousRange
          : nextRange,
      );
    };
    const scheduleUpdate = () => {
      if (animationFrame === undefined) {
        animationFrame = requestAnimationFrame(updateWindow);
      }
    };

    updateWindow();
    scrollContainer.addEventListener('scroll', scheduleUpdate, {passive: true});
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      scrollContainer.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [blockLayout, editorContainerRef, scrollContainerRef]);

  return useMemo<DraftEditorBlockWindowingState | undefined>(() => {
    if (!blockLayout || !windowRange) {
      return undefined;
    }
    const renderedKeys = new Set(
      blockLayout.keys.slice(windowRange.start, windowRange.end),
    );
    renderedKeys.add(editorState.selection.anchorKey);
    renderedKeys.add(editorState.selection.focusKey);
    for (const blockKey of pinnedBlockKeys || []) {
      renderedKeys.add(blockKey);
    }
    return {
      shouldRenderBlock: block => renderedKeys.has(block.key),
      getSpacerHeight: block => blockLayout.heights.get(block.key) || 0,
    };
  }, [
    blockLayout,
    editorState.selection.anchorKey,
    editorState.selection.focusKey,
    pinnedBlockKeys,
    windowRange,
  ]);
}

export const exportedForTesting = {
  getBlockLayout,
  getWindowRange,
  haveEqualLayout,
};
