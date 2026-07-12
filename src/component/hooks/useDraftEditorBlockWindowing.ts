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
import {DraftEditorBlockWindowing} from '../base/DraftEditorProps';

type BlockMeasurement = {
  block: BlockNode;
  height: number;
};

type BlockLayout = {
  keys: string[];
  offsets: number[];
  heights: Map<string, number>;
};

export type DraftEditorBlockWindowingOptions = {
  enabled: boolean;
  editorState: EditorState;
  scrollContainerRef: RefObject<HTMLElement>;
  editorContainerRef: RefObject<HTMLElement>;
  layoutKey?: unknown;
};

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
        block,
        height: element.getBoundingClientRect().height + marginBottom,
      });
      continue;
    }

    const previousMeasurement = previousMeasurements.get(block.key);
    if (previousMeasurement?.block === block) {
      measurements.set(block.key, previousMeasurement);
    }
  }
  return measurements;
}

export function useDraftEditorBlockWindowing({
  enabled,
  editorState,
  scrollContainerRef,
  editorContainerRef,
  layoutKey,
}: DraftEditorBlockWindowingOptions): DraftEditorBlockWindowing | undefined {
  const blockMap = editorState.currentContent.blockMap;
  const measurementsRef = useRef<ReadonlyMap<string, BlockMeasurement>>(new Map());
  const [measurements, setMeasurements] = useState<
    ReadonlyMap<string, BlockMeasurement>
  >(new Map());
  const [needsFullMeasurement, setNeedsFullMeasurement] = useState(false);
  const [measurementRevision, setMeasurementRevision] = useState(0);
  const [windowRange, setWindowRange] = useState<{start: number; end: number}>();

  const updateMeasurements = useCallback(() => {
    const nextMeasurements = measureBlocks(blockMap, measurementsRef.current);
    measurementsRef.current = nextMeasurements;
    setMeasurements(nextMeasurements);
    return nextMeasurements.size === blockMap.size;
  }, [blockMap]);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    const animationFrame = requestAnimationFrame(() => {
      setNeedsFullMeasurement(!updateMeasurements());
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled, layoutKey, measurementRevision, updateMeasurements]);

  useLayoutEffect(() => {
    if (!enabled || !needsFullMeasurement) {
      return;
    }
    const animationFrame = requestAnimationFrame(() => {
      updateMeasurements();
      setNeedsFullMeasurement(false);
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled, needsFullMeasurement, updateMeasurements]);

  useEffect(() => {
    const editorContainer = editorContainerRef.current;
    if (!enabled || !editorContainer || typeof ResizeObserver === 'undefined') {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      measurementsRef.current = new Map();
      setMeasurements(new Map());
      setMeasurementRevision(revision => revision + 1);
    });
    resizeObserver.observe(editorContainer);
    return () => resizeObserver.disconnect();
  }, [editorContainerRef, enabled]);

  const blockLayout = useMemo<BlockLayout | undefined>(() => {
    if (!enabled || measurements.size !== blockMap.size) {
      return undefined;
    }
    const keys: string[] = [];
    const offsets: number[] = [];
    const heights = new Map<string, number>();
    let offset = 0;
    for (const block of blockMap.values()) {
      const measurement = measurements.get(block.key);
      if (!measurement) {
        return undefined;
      }
      keys.push(block.key);
      offsets.push(offset);
      heights.set(block.key, measurement.height);
      offset += measurement.height;
    }
    return {keys, offsets, heights};
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

  return useMemo<DraftEditorBlockWindowing | undefined>(() => {
    if (!blockLayout || !windowRange) {
      return undefined;
    }
    const renderedKeys = new Set(
      blockLayout.keys.slice(windowRange.start, windowRange.end),
    );
    renderedKeys.add(editorState.selection.anchorKey);
    renderedKeys.add(editorState.selection.focusKey);
    return {
      shouldRenderBlock: block => renderedKeys.has(block.key),
      getSpacerHeight: block => blockLayout.heights.get(block.key) || 0,
    };
  }, [blockLayout, editorState.selection.anchorKey, editorState.selection.focusKey, windowRange]);
}

export const exportedForTesting = {getWindowRange};
