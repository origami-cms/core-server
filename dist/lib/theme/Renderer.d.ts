export interface Engine {
    name: string | false;
    engine: any;
}
declare const _default: {
    render(theme: string, fileOrEngine: string, data: object): any;
    getEngine(fileOrEngine: string, themeName: string): Engine;
    getFunction({ name, engine }: Engine, theme: string): Function;
};
export default _default;
