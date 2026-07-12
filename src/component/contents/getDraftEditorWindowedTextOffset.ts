import {ContentState} from '../../model/immutable/ContentState';

function getTextLengthWithinWindowSpacer(
  element: HTMLElement,
  visibleHeight: number,
  spacerTextLength: number,
): number {
  const encodedLayout = element.dataset.blockWindowSpacerLayout;
  if (encodedLayout) {
    let parsedLayout: unknown;
    try {
      parsedLayout = JSON.parse(encodedLayout);
    } catch {
      parsedLayout = undefined;
    }
    if (Array.isArray(parsedLayout)) {
      let remainingHeight = visibleHeight;
      let textLength = 0;
      for (const entry of parsedLayout) {
        if (
          !Array.isArray(entry) ||
          typeof entry[0] !== 'number' ||
          typeof entry[1] !== 'number'
        ) {
          continue;
        }
        const [blockHeight, blockTextLength] = entry;
        if (remainingHeight >= blockHeight) {
          textLength += blockTextLength + 1;
          remainingHeight -= blockHeight;
          continue;
        }
        if (blockHeight > 0) {
          textLength += Math.round(
            blockTextLength * Math.max(0, remainingHeight / blockHeight),
          );
        }
        return textLength;
      }
      return textLength;
    }
  }

  const spacerHeight = element.getBoundingClientRect().height;
  return spacerHeight > 0
    ? Math.round(
        spacerTextLength * Math.max(0, visibleHeight / spacerHeight),
      )
    : spacerTextLength;
}

export function getDraftEditorWindowedTextOffset(
  contentState: ContentState,
  contentsElement: HTMLElement,
  targetY: number,
  viewportHeight: number,
): number | undefined {
  const windowSpacers = contentsElement.querySelectorAll<HTMLElement>(
    '[data-block-window-spacer]',
  );
  if (windowSpacers.length === 0) {
    return undefined;
  }

  const targetBottom = targetY + viewportHeight;
  let textOffset = 0;
  const layoutElements = contentsElement.querySelectorAll<HTMLElement>(
    '[data-block], [data-block-window-spacer]',
  );
  for (const element of layoutElements) {
    const rect = element.getBoundingClientRect();
    if (rect.top >= targetBottom) {
      break;
    }

    const spacerTextLength = Number(
      element.dataset.blockWindowSpacerTextLength,
    );
    const blockKey = element.id.startsWith('block-')
      ? element.id.slice('block-'.length)
      : undefined;
    const block = blockKey ? contentState.blockMap.get(blockKey) : undefined;
    const textLength = Number.isFinite(spacerTextLength)
      ? spacerTextLength
      : block
      ? block.text.length + 1
      : 0;
    if (rect.bottom <= targetBottom || rect.height === 0) {
      textOffset += textLength;
      continue;
    }

    const visibleHeight = targetBottom - rect.top;
    if (Number.isFinite(spacerTextLength)) {
      textOffset += getTextLengthWithinWindowSpacer(
        element,
        visibleHeight,
        spacerTextLength,
      );
    } else if (block) {
      const visibleRatio = Math.max(
        0,
        Math.min(1, visibleHeight / rect.height),
      );
      textOffset += Math.round(block.text.length * visibleRatio);
    }
    break;
  }
  return textOffset;
}
