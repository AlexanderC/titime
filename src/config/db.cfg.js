import Env from '../env';
import path from 'path';

export default {
  path: path.join(Env.homeDir(), '.titime'),
  collections: ['projects'],
  defaultCollection: 'projects',
};
