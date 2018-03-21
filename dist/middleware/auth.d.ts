/// <reference types="express" />
import { NextFunction } from 'express';
import { Origami } from '../types/global';
declare const _default: (req: Origami.ServerRequest, res: Origami.ServerResponse, next: NextFunction) => Promise<void>;
export default _default;
