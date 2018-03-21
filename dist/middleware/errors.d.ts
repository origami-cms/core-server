/// <reference types="express" />
import { Origami } from "../types/global";
import { NextFunction } from "express";
declare const _default: () => (err: Origami.ServerError, req: Origami.ServerRequest, res: Origami.ServerResponse, next: NextFunction) => Promise<void>;
export default _default;
