import {Route} from '../../../../../Router';

const r = new Route('/api/v1/pages/tree');
module.exports = r;

r.get(async(req, res, next) => {
    const model = await res.app.get('store').model('page');

    interface Page {
        id: string;
        url: string;
        title: string;
    }
    const rootPages: Page[] = await model.find({parent: null});

    res.data = [] as Page[];

    await Promise.all(rootPages.map(page => new Promise(async _res => {
        (res.data as object[]).push({
            id: page.id,
            url: page.url,
            title: page.title,
            children: await model.children(page.id, ['url', 'title'])
        });
        _res();
    })));

    next();
});
