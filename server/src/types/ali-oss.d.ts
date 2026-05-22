declare module 'ali-oss' {
  interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
  }

  interface PutObjectResult {
    url: string;
    name: string;
  }

  class OSS {
    constructor(options: OSSOptions);
    put(name: string, file: Buffer): Promise<PutObjectResult>;
    signatureUrl(name: string, options?: { expires?: number }): Promise<string>;
  }

  export default OSS;
}
