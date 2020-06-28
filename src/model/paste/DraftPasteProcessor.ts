/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {makeContentBlock} from '../immutable/ContentBlock';
import {DraftBlockRenderMap} from '../immutable/DraftBlockRenderMap';
import {EntityMap} from '../immutable/EntityMap';
import convertFromHTMLToContentBlocks from '../encoding/convertFromHTMLToContentBlocks';
import {CharacterMetadata} from '../immutable/CharacterMetadata';
import {DraftBlockType} from '../constants/DraftBlockType';
import sanitizeDraftText from '../encoding/sanitizeDraftText';
import generateRandomKey from '../keys/generateRandomKey';
import {repeat} from '../descript/Iterables';
import getSafeBodyFromHTML from './getSafeBodyFromHTML';
import {BlockNode} from '../immutable/BlockNode';

const DraftPasteProcessor = {
  processHTML(
    html: string,
    blockRenderMap?: DraftBlockRenderMap,
  ):
    | {
        contentBlocks: Array<BlockNode> | undefined;
        entityMap: EntityMap;
      }
    | undefined
    | null {
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
  ): BlockNode[] {
    return textBlocks.reduce((acc: BlockNode[], textLine) => {
      textLine = sanitizeDraftText(textLine);
      const key = generateRandomKey();

      const blockNodeConfig = {
        key,
        type,
        text: textLine,
        characterList: Array.from(repeat(textLine.length, character)),
      } as Partial<BlockNode>;

      acc.push(makeContentBlock(blockNodeConfig));

      return acc;
    }, []);
  },
};
export default DraftPasteProcessor;
