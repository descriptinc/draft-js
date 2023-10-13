import {
  addFocusToSelection,
  addPointToSelection,
} from './setDraftEditorSelection';
import {SelectionObject} from '../utils/DraftDOMTypes';
import {SelectionState} from '../../model/immutable/SelectionState';

export type DOMLocation = {
  node: Node;
  offset: number;
};

export type DOMSelectionUpdateFn = (
  type: 'anchor' | 'focus',
  loc: DOMLocation,
) => void;

/**
 * Modifies the DOM selection according to a set of updates.
 * The updates are assumed to be in order of occurrence within the document.
 * A later update of the same type (e.g., "anchor") will override a previous
 * update of that type.
 */
export function updateDOMSelection(
  domSelection: SelectionObject,
  newAnchor: DOMLocation | undefined,
  newFocus: DOMLocation | undefined,
  draftSelection: SelectionState,
): void {
  // if there's a missing focus or anchor, assume a point selection
  newAnchor = newAnchor || newFocus;
  newFocus = newFocus || newAnchor;
  if (!newAnchor || !newFocus) {
    // if neither, assume that a selection update was not needed
    return;
  }

  const anchorChanged =
    domSelection.anchorNode !== newAnchor.node ||
    domSelection.anchorOffset !== newAnchor.offset;
  const focusChanged =
    domSelection.focusNode !== newFocus.node ||
    domSelection.focusOffset !== newFocus.offset;

  // only update the selection if it is not already correct
  if (anchorChanged || focusChanged) {
    if (anchorChanged) {
      // start a selection from scratch
      domSelection.removeAllRanges();
      addPointToSelection(
        domSelection,
        newAnchor.node,
        newAnchor.offset,
        draftSelection,
      );
    }
    // add the focus
    addFocusToSelection(
      domSelection,
      newFocus.node,
      newFocus.offset,
      draftSelection,
    );
  }
}
