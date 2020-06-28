export type SyntheticEvent<T = Record<string, unknown>> = React.SyntheticEvent<
  T
>;
export type SyntheticClipboardEvent<
  T = Record<string, unknown>
> = React.ClipboardEvent<T>;
export type SyntheticInputEvent = React.SyntheticEvent<HTMLInputElement>;
