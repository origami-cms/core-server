/// <reference types="express" />
import { NextFunction } from 'express';
import { Origami } from '../types/global';
declare const _default: () => Promise<(req: Origami.ServerRequest, res: Origami.ServerResponse, next: NextFunction) => void>;
export default _default;
