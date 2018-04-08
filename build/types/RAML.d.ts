export default interface RAML {
    resources: RAMLResource[];
}
export interface RAMLResource {
    relativeUri: string;
    absoluteUri: string;
    displayName: string;
    securedBy: {
        schemeName: string;
    }[];
    methods: {
        protocols: string[];
        securedBy: object[];
        description: string;
        method: string;
        allUriParameters: object[];
    }[];
    resources: RAMLResource[];
}
