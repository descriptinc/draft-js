import {RefObject, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {EditorState} from '../../model/immutable/EditorState';

export type DraftEditorBlockSkeletonState = Readonly<{
  fullBlockKeys: ReadonlySet<string>;
}>;

type Options = Readonly<{
  enabled: boolean;
  editorState: EditorState;
  contentsRef: RefObject<HTMLElement>;
  scrollContainerRef: RefObject<HTMLElement>;
}>;

const OBSERVER_MARGIN = '500px 0px';

export function useDraftEditorBlockSkeleton({
  enabled,
  editorState,
  contentsRef,
  scrollContainerRef,
}: Options): DraftEditorBlockSkeletonState | undefined {
  const [visibleBlockKeys, setVisibleBlockKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const hasRefreshedGeometry = useRef(false);
  const blockMap = editorState.currentContent.blockMap;
  const canObserve =
    typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined';

  useLayoutEffect(() => {
    if (!enabled || !canObserve) {
      hasRefreshedGeometry.current = false;
      return;
    }

    const contents = contentsRef.current;
    if (!contents) {
      return;
    }

    const observerOptions = {
      root: scrollContainerRef.current,
      rootMargin: OBSERVER_MARGIN,
    };
    const handleEntries: IntersectionObserverCallback = entries => {
      setVisibleBlockKeys(previousKeys => {
        const nextKeys = new Set(previousKeys);
        let changed = false;
        for (const entry of entries) {
          const blockKey = (entry.target as HTMLElement).dataset.blockKey;
          if (!blockKey) {
            continue;
          }
          if (entry.isIntersecting) {
            if (!nextKeys.has(blockKey)) {
              nextKeys.add(blockKey);
              changed = true;
            }
          } else if (nextKeys.delete(blockKey)) {
            changed = true;
          }
        }
        return changed ? nextKeys : previousKeys;
      });
    };
    const observer = new IntersectionObserver(handleEntries, observerOptions);

    const blockElements = contents.querySelectorAll('[data-block-key]');
    if (!hasRefreshedGeometry.current && visibleBlockKeys.size > 0) {
      hasRefreshedGeometry.current = true;
      for (const blockElement of blockElements) {
        blockElement.getBoundingClientRect();
      }
    }
    for (const blockElement of blockElements) {
      observer.observe(blockElement);
    }
    return () => observer.disconnect();
  }, [
    blockMap,
    canObserve,
    contentsRef,
    enabled,
    scrollContainerRef,
    visibleBlockKeys,
  ]);

  return useMemo(() => {
    if (!enabled || !canObserve) {
      return undefined;
    }

    const fullBlockKeys = new Set(visibleBlockKeys);
    fullBlockKeys.add(editorState.selection.anchorKey);
    fullBlockKeys.add(editorState.selection.focusKey);
    return {fullBlockKeys};
  }, [
    canObserve,
    editorState.selection.anchorKey,
    editorState.selection.focusKey,
    enabled,
    visibleBlockKeys,
  ]);
}
