export type DataTransferType = {
  types: string[];
  isRichText: () => boolean;
  hasFiles: () => boolean;
  getFiles: () => File[];
  getText: () => string | null;
  getHTML: () => string | null;
  isLink: () => boolean;
  getLink: () => string | null;
  isImage: () => boolean;
};
