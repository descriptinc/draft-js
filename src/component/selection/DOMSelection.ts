import {SelectionObject} from '../utils/DraftDOMTypes';
import getCorrectDocumentFromNode from '../utils/getCorrectDocumentFromNode';
import containsNode from 'fbjs/lib/containsNode';

export function getDOMSelection(node: Node): SelectionObject | undefined {
  // It's possible that the editor has been removed from the DOM but
  // our selection code doesn't know it yet. Forcing selection in
  // this case may lead to errors, so just bail now.
  const documentObject = getCorrectDocumentFromNode(node);
  if (!containsNode(documentObject.documentElement, node)) {
    return undefined;
  }

  return documentObject.defaultView!.getSelection() as SelectionObject;
}
