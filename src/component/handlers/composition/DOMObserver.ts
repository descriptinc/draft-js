/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import UserAgent from 'fbjs/lib/UserAgent';
import getWindowForNode from '../../utils/getWindowForNode';
import invariant from '../../../fbjs/invariant';
import {nullthrows} from '../../../fbjs/nullthrows';
import findAncestorOffsetKey from '../../selection/findAncestorOffsetKey';

type MutationRecordT =
  | MutationRecord
  | {
      type: 'characterData';
      target: Node;
      removedNodes?: void;
    };

// Heavily based on Prosemirror's DOMObserver https://github.com/ProseMirror/prosemirror-view/blob/master/src/domobserver.js

const DOM_OBSERVER_OPTIONS = {
  subtree: true,
  characterData: true,
  childList: false,
  characterDataOldValue: false,
  attributes: false,
};
// IE11 has very broken mutation observers, so we also listen to DOMCharacterDataModified
const USE_CHAR_DATA = UserAgent.isBrowser('IE <= 11');

export default class DOMObserver {
  observer: MutationObserver | null = null;
  container: HTMLElement;
  mutations: Map<string, string>;
  onCharData: ((arg0: Event) => void) | undefined;

  constructor(container: HTMLElement) {
    this.container = container;
    this.mutations = new Map();
    const containerWindow = getWindowForNode(container);
    if (containerWindow.MutationObserver && !USE_CHAR_DATA) {
      this.observer = new containerWindow.MutationObserver(mutations =>
        this.registerMutations(mutations),
      );
    } else {
      this.onCharData = e => {
        invariant(
          e.target instanceof Node,
          'Expected target to be an instance of Node',
        );
        this.registerMutations([
          {
            type: 'characterData',
            target: e.target as Node,
          },
        ]);
      };
    }
  }

  start(): void {
    if (this.observer) {
      this.observer.observe(this.container, DOM_OBSERVER_OPTIONS);
    } else {
      /* $FlowFixMe(>=0.68.0 site=www,mobile) This event type is not defined
       * by Flow's standard library */
      this.container.addEventListener(
        'DOMCharacterDataModified',
        this.onCharData!,
      );
    }
  }

  stopAndFlushMutations(): Map<string, string> {
    const {observer} = this;
    if (observer) {
      this.registerMutations(observer.takeRecords());
      observer.disconnect();
    } else {
      /* $FlowFixMe(>=0.68.0 site=www,mobile) This event type is not defined
       * by Flow's standard library */
      this.container.removeEventListener(
        'DOMCharacterDataModified',
        this.onCharData!,
      );
    }
    const mutations = this.mutations;
    this.mutations = new Map();
    return mutations;
  }

  registerMutations(mutations: MutationRecordT[]): void {
    const mutationsToProcess = new Map<Node, MutationRecordT>();

    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      // Sometimes we get multiple mutations for the same target.
      // Only process the latest.
      mutationsToProcess.set(mutation.target, mutation);
    }

    const newMutations = new Map<string, string>();
    for (const mutation of mutationsToProcess.values()) {
      const textContent = this.getMutationTextContent(mutation);
      if (textContent != null) {
        const offsetKey = nullthrows(findAncestorOffsetKey(mutation.target));
        // Join text for multiple mutations in the same block (i.e., same offsetKey)
        let newContent = newMutations.get(offsetKey) || '';
        if (newContent.length > 0) {
          newContent += '\n';
        }
        newContent += textContent;
        newMutations.set(offsetKey, newContent);
      }
    }
    for (const [key, value] of newMutations) {
      this.mutations.set(key, value);
    }
  }

  getMutationTextContent(mutation: MutationRecordT): string | null {
    const {type, target} = mutation;
    if (type === 'characterData') {
      // When `textContent` is '', there is a race condition that makes
      // getting the offsetKey from the target not possible.
      // These events are also followed by a `childList`, which is the one
      // we are able to retrieve the offsetKey and apply the '' text.
      if (target.textContent !== '') {
        // IE 11 considers the enter keypress that concludes the composition
        // as an input char. This strips that newline character so the draft
        // state does not receive spurious newlines.
        if (USE_CHAR_DATA) {
          return target.textContent!.replace('\n', '');
        }
        return target.textContent;
      }
    }
    return null;
  }
}
