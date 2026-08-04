import {RefObject, useLayoutEffect, useMemo, useState} from 'react';
import {EditorState} from '../../model/immutable/EditorState';

export type DraftEditorBlockSkeletonState = Readonly<{
  fullBlockKeys: ReadonlySet<string>;
}>;

type Options = Readonly<{
  enabled: boolean;
  editorState: EditorState;
  contentsElement: HTMLElement | null;
  scrollContainerRef?: RefObject<HTMLElement>;
}>;

const OBSERVER_MARGIN = '500px 0px';

function supportsNativeScrollAnchoring(): boolean {
  return (
    typeof CSS === 'undefined' ||
    typeof CSS.supports !== 'function' ||
    CSS.supports('overflow-anchor: auto')
  );
}

export function useDraftEditorBlockSkeleton({
  enabled,
  editorState,
  contentsElement,
  scrollContainerRef,
}: Options): DraftEditorBlockSkeletonState | undefined {
  const [visibleBlockKeys, setVisibleBlockKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const canObserve =
    typeof window !== 'undefined' &&
    typeof IntersectionObserver !== 'undefined' &&
    supportsNativeScrollAnchoring();

  useLayoutEffect(() => {
    if (!enabled || !canObserve) {
      return;
    }
    if (!contentsElement) {
      return;
    }

    const observerOptions = {
      root: scrollContainerRef?.current ?? contentsElement,
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

    const getBlockElements = (node: Node): Element[] => {
      if (!(node instanceof Element)) {
        return [];
      }
      const elements = Array.from(node.querySelectorAll('[data-block-key]'));
      if (node.matches('[data-block-key]')) {
        elements.unshift(node);
      }
      return elements;
    };
    for (const blockElement of getBlockElements(contentsElement)) {
      observer.observe(blockElement);
    }

    const mutationObserver = new MutationObserver(mutations => {
      const removedKeys = new Set<string>();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          for (const blockElement of getBlockElements(node)) {
            observer.observe(blockElement);
          }
        }
        for (const node of mutation.removedNodes) {
          for (const blockElement of getBlockElements(node)) {
            observer.unobserve(blockElement);
            const blockKey = (blockElement as HTMLElement).dataset.blockKey;
            if (blockKey) {
              removedKeys.add(blockKey);
            }
          }
        }
      }
      if (removedKeys.size > 0) {
        setVisibleBlockKeys(previousKeys => {
          const nextKeys = new Set(previousKeys);
          for (const key of removedKeys) {
            nextKeys.delete(key);
          }
          return nextKeys.size === previousKeys.size ? previousKeys : nextKeys;
        });
      }
    });
    mutationObserver.observe(contentsElement, {childList: true, subtree: true});

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [canObserve, contentsElement, enabled, scrollContainerRef]);

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
