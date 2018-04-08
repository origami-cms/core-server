import Server from '../server';
import rootUser from './rootUser';

export default async(app: Server) => {
    await rootUser(app);
};
