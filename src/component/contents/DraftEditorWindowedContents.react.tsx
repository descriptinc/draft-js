import React, {RefObject} from 'react';
import {DraftEditorBlockWindowingOptions} from '../base/DraftEditorProps';
import DraftEditorContents from './DraftEditorContents-core.react';
import {useDraftEditorBlockWindowing} from '../hooks/useDraftEditorBlockWindowing';

type Props = Omit<React.ComponentProps<typeof DraftEditorContents>, 'blockWindowing'> & {
  blockWindowing?: DraftEditorBlockWindowingOptions;
  contentsKey: number;
  editorContainerRef: RefObject<HTMLElement>;
};

export default function DraftEditorWindowedContents({
  blockWindowing,
  contentsKey,
  editorContainerRef,
  ...contentsProps
}: Props): React.ReactNode {
  const resolvedBlockWindowing = useDraftEditorBlockWindowing({
    enabled: blockWindowing?.enabled ?? false,
    editorState: contentsProps.editorState,
    scrollContainerRef:
      blockWindowing?.scrollContainerRef ?? editorContainerRef,
    editorContainerRef,
    layoutKey: contentsProps.blockStyleFn,
    pinnedBlockKeys: blockWindowing?.pinnedBlockKeys,
  });

  return (
    <DraftEditorContents
      {...contentsProps}
      blockWindowing={resolvedBlockWindowing}
      key={'contents' + contentsKey}
    />
  );
}
