declare module 'mammoth' {
  interface MammothOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
    styleMap?: string[];
    convertImage?: unknown;
  }

  interface ConversionResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function convertToHtml(options: MammothOptions): Promise<ConversionResult>;
  export function extractRawText(options: MammothOptions): Promise<ConversionResult>;
}
