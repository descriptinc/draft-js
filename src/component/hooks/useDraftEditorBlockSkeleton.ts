import {RefObject, useLayoutEffect, useMemo, useState} from 'react';
import {EditorState} from '../../model/immutable/EditorState';

export type DraftEditorBlockSkeletonState = Readonly<{
  fullBlockKeys: ReadonlySet<string>;
}>;

type Options = Readonly<{
  enabled: boolean;
  editorState: EditorState;
  contentsRef: RefObject<HTMLElement>;
  scrollContainerRef: RefObject<HTMLElement>;
  pinnedBlockKeys?: ReadonlySet<string>;
}>;

const OBSERVER_MARGIN = '1200px 0px';

export function useDraftEditorBlockSkeleton({
  enabled,
  editorState,
  contentsRef,
  scrollContainerRef,
  pinnedBlockKeys,
}: Options): DraftEditorBlockSkeletonState | undefined {
  const [visibleBlockKeys, setVisibleBlockKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const blockMap = editorState.currentContent.blockMap;
  const canObserve =
    typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined';

  useLayoutEffect(() => {
    if (!enabled || !canObserve) {
      return;
    }

    const contents = contentsRef.current;
    if (!contents) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
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
      },
      {
        root: scrollContainerRef.current,
        rootMargin: OBSERVER_MARGIN,
      },
    );

    for (const blockElement of contents.querySelectorAll('[data-block-key]')) {
      observer.observe(blockElement);
    }
    return () => observer.disconnect();
  }, [
    blockMap,
    canObserve,
    contentsRef,
    enabled,
    scrollContainerRef,
  ]);

  return useMemo(() => {
    if (!enabled || !canObserve) {
      return undefined;
    }

    const fullBlockKeys = new Set(visibleBlockKeys);
    fullBlockKeys.add(editorState.selection.anchorKey);
    fullBlockKeys.add(editorState.selection.focusKey);
    for (const blockKey of pinnedBlockKeys || []) {
      fullBlockKeys.add(blockKey);
    }
    return {fullBlockKeys};
  }, [
    canObserve,
    editorState.selection.anchorKey,
    editorState.selection.focusKey,
    enabled,
    pinnedBlockKeys,
    visibleBlockKeys,
  ]);
}
