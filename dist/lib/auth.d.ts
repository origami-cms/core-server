export declare const passwordHash: (pass: string) => Promise<string>;
export declare const passwordCompare: (pass: string, hash: string) => Promise<Boolean>;
export declare const jwtSign: (data: object) => string;
export interface JWTVerifyResult {
    iat: string;
    exp: string;
    userId: string;
    email: string;
}
export declare const jwtVerify: (token: string) => JWTVerifyResult;
