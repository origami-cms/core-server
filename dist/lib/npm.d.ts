import { Origami } from 'origami-core-lib';
/**
 * Get's a list of origami modules with a specific type
 * @param type Type of module to find
 */
export declare const list: (type: Origami.ModuleType) => string[];
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
        };
        author: {
            name: string;
            email: string;
            username: string;
        };
        publisher: {
            username: string;
            email: string;
        };
        maintainers: [{
            username: string;
            email: string;
        }];
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
        };
    };
    searchScore: number;
}
export declare const search: (type?: string) => Promise<{
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
    };
    author: {
        name: string;
        email: string;
        username: string;
    };
    publisher: {
        username: string;
        email: string;
    };
    maintainers: [{
            username: string;
            email: string;
        }];
}[]>;
