declare namespace NodeJS {
  interface Global {
    __DEV__: boolean;
    execCommand: (commandId: string, showUi: boolean, value: boolean) => void;
  }
}
