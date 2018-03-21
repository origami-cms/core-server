import { Request, Response } from "express";

export module Origami {
    export namespace Server {
        export type Position = 'init' | 'pre-store' | 'store' | 'post-store' | 'pre-render' | 'render' | 'post-render' | 'pre-send'

        export type URL = string | null | RegExp;

        export type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'PATCH' | 'USE'
    }

    export namespace Theme {
        export interface Config {
            name: string,
            paths?: {
                styles?: string
                views?: string
                content?: string
            }
        }
    }

    // ------------------------------------------------------------- Config file
    export interface Config {
        /** Settings for the overall project */
        "app": ConfigApp;
        /** Settings for the store/database */
        "store": ConfigStore;
        /** Settings for the theme */
        "theme": ConfigTheme;
        /** Settings for the server setup */
        "server": ConfigServer;
    }

    export interface ConfigApp {
        /** Name of the project */
        "name": string;
    }

    export interface ConfigStore {
        /** Store/Database type to integrate with */
        "type": string;
        /** Store/Database hostname to connect with */
        "host": string;
        /** Store/Database port to connect with */
        "port": number;
        /** Store/Database db name to connect with */
        "database": string;
        /** Store/Database username to connect with */
        "username": string;
        /** Store/Database password to connect with */
        "password": string;
    }

    export interface ConfigTheme {
        /** Theme name to run */
        "name": string
    }

    export interface ConfigServer {
        /** Secret code to encrypt data and authentication tokens with */
        "secret": string,
        /** Port number to run the server on */
        "port": number
        /** Server language */
        "ln": string,
    }

    export interface ServerRequest extends Request {
        jwt: {
            token: string,
            data: object
        }
    }

    export interface ServerResponse extends Response {
        data?: object,
        body?: string,
        text?: string,
        responseCode?: string
    }

    export interface ServerError extends Error {
        data: object
    }

    /**
     * Valid types of Origami modules to install via NPM
     * @example origami-theme-snow, origami-store-mongodb, origami-plugin-facebook
     */
    export type ModuleType = 'theme' | 'store' | 'plugin' | 'admin'
}
