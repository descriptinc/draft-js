import React, {ReactNode} from 'react';

export default function wrapInDOMAnchors(
  children: ReactNode,
  anchorIds: readonly string[] | undefined,
): ReactNode {
  let result = children;
  for (const anchorId of anchorIds ?? []) {
    result = (
      <span id={anchorId} key={anchorId}>
        {result}
      </span>
    );
  }
  return result;
}
