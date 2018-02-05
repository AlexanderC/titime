import path from 'path';
import Env from '../env';

export default {
  path: path.join(Env.homeDir(), '.titime'),
  collections: ['projects', 'system'],
  defaultCollection: 'projects',
  backupOnStart: true,
};
