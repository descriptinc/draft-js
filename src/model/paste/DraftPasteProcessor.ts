/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {gkx} from '../../stubs/gkx';
import {makeContentBlockNode} from '../immutable/ContentBlockNode';
import {makeContentBlock} from '../immutable/ContentBlock';
import {DraftBlockRenderMap} from '../immutable/DraftBlockRenderMap';
import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import {EntityMap} from '../immutable/EntityMap';
import getSafeBodyFromHTML from './__mocks__/getSafeBodyFromHTML';

const experimentalTreeDataSupport = gkx('draft_tree_data_support');
const makeBlock = experimentalTreeDataSupport
  ? makeContentBlockNode
  : makeContentBlock;

const DraftPasteProcessor = {
  processHTML(
    html: string,
    blockRenderMap?: DraftBlockRenderMap,
  ): {
    contentBlocks: Array<BlockNodeRecord> | null;
    entityMap: EntityMap;
  } | null {
    return convertFromHTMLToContentBlocks(
      html,
      getSafeBodyFromHTML,
      blockRenderMap,
    );
  },

  processText(
    textBlocks: Array<string>,
    character: CharacterMetadata,
    type: DraftBlockType,
  ): Array<BlockNodeRecord> {
    return textBlocks.reduce((acc, textLine, index) => {
      textLine = sanitizeDraftText(textLine);
      const key = generateRandomKey();

      let blockNodeConfig = {
        key,
        type,
        text: textLine,
        characterList: List(Repeat(character, textLine.length)),
      };

      // next block updates previous block
      if (experimentalTreeDataSupport && index !== 0) {
        const prevSiblingIndex = index - 1;
        // update previous block
        const previousBlock = (acc[prevSiblingIndex] = acc[
          prevSiblingIndex
        ].merge({
          nextSibling: key,
        }));
        blockNodeConfig = {
          ...blockNodeConfig,
          prevSibling: previousBlock.key,
        };
      }

      acc.push(new ContentBlockRecord(blockNodeConfig));

      return acc;
    }, []);
  },
};

module.exports = DraftPasteProcessor;
