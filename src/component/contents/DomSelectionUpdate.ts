export type DomSelectionUpdate = {
  type: 'focus' | 'anchor';
  node: Node;
  offset: number;
};
