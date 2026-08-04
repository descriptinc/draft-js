import React, {useState} from 'react';
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
  const [contentsElement, setContentsElement] = useState<HTMLDivElement | null>(
    null,
  );
  const skeletonState = useDraftEditorBlockSkeleton({
    enabled: blockSkeleton?.enabled ?? false,
    editorState: contentsProps.editorState,
    contentsElement,
    scrollContainerRef: blockSkeleton?.scrollContainerRef,
  });

  return (
    <DraftEditorContents
      {...contentsProps}
      blockSkeleton={skeletonState}
      contentsRef={setContentsElement}
    />
  );
}
