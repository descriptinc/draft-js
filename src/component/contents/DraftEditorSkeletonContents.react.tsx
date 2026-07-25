import React, {useRef} from 'react';
import {DraftEditorBlockSkeletonOptions} from '../base/DraftEditorProps';
import DraftEditorContents from './DraftEditorContents-core.react';
import {useDraftEditorBlockSkeleton} from '../hooks/useDraftEditorBlockSkeleton';

type Props = Omit<
  React.ComponentProps<typeof DraftEditorContents>,
  'blockSkeleton'
> & {
  blockSkeleton?: DraftEditorBlockSkeletonOptions;
};

export default function DraftEditorSkeletonContents({
  blockSkeleton,
  ...contentsProps
}: Props): React.ReactNode {
  const contentsRef = useRef<HTMLDivElement | null>(null);
  const skeletonState = useDraftEditorBlockSkeleton({
    enabled: blockSkeleton?.enabled ?? false,
    editorState: contentsProps.editorState,
    contentsRef,
    scrollContainerRef: blockSkeleton?.scrollContainerRef ?? contentsRef,
    pinnedBlockKeys: blockSkeleton?.pinnedBlockKeys,
  });

  return (
    <DraftEditorContents
      {...contentsProps}
      blockSkeleton={skeletonState}
      contentsRef={node => {
        contentsRef.current = node;
      }}
    />
  );
}
