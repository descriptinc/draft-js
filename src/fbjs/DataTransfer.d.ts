declare module 'fbjs/lib/DataTransfer' {
  class DataTransfer {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(data: any);
    types: string[];
    isRichText: () => boolean;
    hasFiles: () => boolean;
    getFiles: () => File[];
    getText: () => string | null;
    getHTML: () => string | null;
    isLink: () => boolean;
    getLink: () => string | null;
    isImage: () => boolean;
  }
  export = DataTransfer;
}
