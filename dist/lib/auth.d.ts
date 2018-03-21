export declare const passwordHash: (pass: string) => Promise<string>;
export declare const passwordCompare: (pass: string, hash: string) => Promise<Boolean>;
export declare const jwtSign: (data: object) => string;
export declare const jwtVerify: (token: string) => string | object;
