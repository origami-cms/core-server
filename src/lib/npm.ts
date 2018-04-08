import {Origami} from 'origami-core-lib';

const npm = require('npm-programmatic');
import _ from 'lodash';
import request from 'request-promise-native';

/**
 * Get's a list of origami modules with a specific type
 * @param type Type of module to find
 */
export const list = (type: Origami.ModuleType) => {
    let reg: RegExp | null = null;
    if (type) reg = new RegExp(`origami-${type}`);

    let list: string[] = npm.list(process.cwd());
    list = list
        .filter(p => !_.endsWith(p, 'extraneous'))
        .map(p => {
            const res = (/^(.*)@.+$/).exec(p);
            return res ? res[1] : false;
        })
        .filter(p => p !== false) as string[];

    if (!reg) return list;
    return list.filter(p => (reg as RegExp).test(p));
};



export interface NPMSearchResults {
    total: number;
    results: NPMSearchResult[];
}

export interface NPMSearchResult {
    package: {
        name: string;
        scope: string;
        version: string;
        description: string;
        date: string;
        links: {
            npm: string;
            homepage: string;
            repository: string;
            bugs: string;
        },
        author: {
            name: string;
            email: string;
            username: string;
        },
        publisher: {
            username: string;
            email: string;
        },
        maintainers: [
            {
                username: string;
                email: string;
            }
        ]
    };
    flags: {
        unstable: boolean;
    };
    score: {
        final: number;
        detail: {
            quality: number;
            popularity: number;
            maintenance: number;
        }
    };
    searchScore: number;
}

// Searches api.npms.io
export const search = async (type = '') => {
    let reg: RegExp | null = null;
    if (type) reg = new RegExp(`origami-${type}`);

    const {results: list} = JSON.parse(await request(`https://api.npms.io/v2/search?q=origami-${type}-`)) as NPMSearchResults;

    const simple = list.map(p => p.package);

    if (!reg) return simple;
    return simple.filter((p: {name: string}) => (reg as RegExp).test(p.name));
};


