import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Options from '../Options';

const SALT_ROUNDS = 10;


export const passwordHash = (pass: string): Promise<string> =>
    bcrypt.hash(pass, SALT_ROUNDS);


export const passwordCompare = (pass: string, hash: string): Promise<Boolean> =>
    bcrypt.compare(pass, hash);


export const jwtSign = (data: object): string =>
    jwt.sign(
        data,
        Options.options.secret.toString(),
        {
            expiresIn: '30m'
        }
    );

export interface JWTVerifyResult {
    iat: string;
    exp: string;
    userId: string;
    email: string;
}
export const jwtVerify = (token: string): JWTVerifyResult =>
    jwt.verify(
        token,
        Options.options.secret.toString()
    ) as JWTVerifyResult;