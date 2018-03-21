/// <reference types="express" />
import { Response, NextFunction } from "express";
import { Origami } from '../types/global';
declare const _default: (req: Origami.ServerRequest, res: Response, next: NextFunction) => Promise<void>;
export default _default;
