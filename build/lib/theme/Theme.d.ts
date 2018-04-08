import { Origami } from 'origami-core-lib';
export interface TemplateFile {
    name: string;
    type: string;
    template: string;
    config?: object;
}
declare const _default: {
    config: Origami.Theme.Config;
    readonly pathTheme: string;
    readonly pathPages: string;
    readonly pathTemplates: string;
    readonly pathStyles: string;
    readonly pathRoutes: string;
    templates(template?: string | undefined): Promise<TemplateFile | TemplateFile[]>;
    routes(): Promise<string[]>;
    load(theme: string): void;
    getPageTypeProperties(type: string): any;
    renderPage(p: string, data?: object): Promise<any>;
    renderTemplate(p: string, data?: object): Promise<any>;
    renderStyles(p: string): Promise<any>;
    _renderPage(p: string, data: object, prefix: string): Promise<any>;
    _renderStyles(p: string): Promise<any>;
    _getFile(url: string, prefix: string): Promise<string | false>;
};
export default _default;
