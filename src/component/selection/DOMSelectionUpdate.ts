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
 * Modifies the DOM selection according to a new anchor and focus.
 * This function attempts to perform a minimal update for performance
 * reasons (i.e., it the selection hasn't changed, it will not update
 * the selection; if only the focus has changed, it will not modify the
 * anchor).
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
