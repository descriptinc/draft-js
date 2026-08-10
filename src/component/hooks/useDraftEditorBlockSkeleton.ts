import {RefObject, useLayoutEffect, useMemo, useState} from 'react';
import * as ReactDOM from 'react-dom';
import {EditorState} from '../../model/immutable/EditorState';

export type DraftEditorBlockSkeletonState = Readonly<{
  fullBlockKeys: ReadonlySet<string>;
}>;

type Options = Readonly<{
  enabled: boolean;
  editorState: EditorState;
  contentsElement: HTMLElement | null;
  onBlockSkeletonsRendered?: () => void;
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

function getBlockElements(node: Node): HTMLElement[] {
  if (!(node instanceof Element)) {
    return [];
  }
  const elements = Array.from(
    node.querySelectorAll<HTMLElement>('[data-block-key]'),
  );
  if (node instanceof HTMLElement && node.matches('[data-block-key]')) {
    elements.unshift(node);
  }
  return elements;
}

function getViewportSkeletonBlockKeys(
  blockElements: readonly HTMLElement[],
  scrollContainer: HTMLElement,
): Set<string> {
  const viewport = scrollContainer.getBoundingClientRect();
  let lowerBound = 0;
  let upperBound = blockElements.length;
  while (lowerBound < upperBound) {
    const midpoint = Math.floor((lowerBound + upperBound) / 2);
    const block = blockElements[midpoint];
    if (block && block.getBoundingClientRect().bottom <= viewport.top) {
      lowerBound = midpoint + 1;
    } else {
      upperBound = midpoint;
    }
  }

  const blockKeys = new Set<string>();
  for (let index = lowerBound; index < blockElements.length; index += 1) {
    const block = blockElements[index];
    if (!block) {
      continue;
    }
    const bounds = block.getBoundingClientRect();
    if (bounds.top >= viewport.bottom) {
      break;
    }
    const blockKey = block.hasAttribute('data-block-skeleton')
      ? block.dataset.blockKey
      : undefined;
    if (blockKey) {
      blockKeys.add(blockKey);
    }
  }
  return blockKeys;
}

export function useDraftEditorBlockSkeleton({
  enabled,
  editorState,
  contentsElement,
  onBlockSkeletonsRendered,
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

    let blockElements = getBlockElements(contentsElement);
    for (const blockElement of blockElements) {
      observer.observe(blockElement);
    }

    const scrollContainer = scrollContainerRef?.current ?? contentsElement;
    const handleScroll = () => {
      const blockKeys = getViewportSkeletonBlockKeys(
        blockElements,
        scrollContainer,
      );
      if (blockKeys.size === 0) {
        return;
      }
      const updateVisibleBlockKeys = () => {
        setVisibleBlockKeys(previousKeys => {
          if ([...blockKeys].every(blockKey => previousKeys.has(blockKey))) {
            return previousKeys;
          }
          return new Set([...previousKeys, ...blockKeys]);
        });
      };
      const flush =
        'flushSync' in ReactDOM ? ReactDOM.flushSync : undefined;
      if (flush) {
        flush(updateVisibleBlockKeys);
      } else {
        updateVisibleBlockKeys();
      }
    };
    scrollContainer.addEventListener('scroll', handleScroll, {passive: true});

    const mutationObserver = new MutationObserver(mutations => {
      const addedKeys = new Set<string>();
      const removedKeys = new Set<string>();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          for (const blockElement of getBlockElements(node)) {
            observer.observe(blockElement);
            const blockKey = blockElement.dataset.blockKey;
            if (blockKey) {
              addedKeys.add(blockKey);
            }
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
            if (!addedKeys.has(key)) {
              nextKeys.delete(key);
            }
          }
          return nextKeys.size === previousKeys.size ? previousKeys : nextKeys;
        });
      }
      blockElements = getBlockElements(contentsElement);
    });
    mutationObserver.observe(contentsElement, {childList: true, subtree: true});

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [canObserve, contentsElement, enabled, scrollContainerRef]);

  const skeletonState = useMemo(() => {
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

  useLayoutEffect(() => {
    if (skeletonState) {
      onBlockSkeletonsRendered?.();
    }
  }, [onBlockSkeletonsRendered, skeletonState]);

  return skeletonState;
}
