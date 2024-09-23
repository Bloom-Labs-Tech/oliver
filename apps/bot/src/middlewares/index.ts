import { AdminMiddleware } from './admin';
import { DeveloperMiddleware } from './developer';

const middlewares = {
  adminOnly: new AdminMiddleware(),
  devOnly: new DeveloperMiddleware(),
};

export default middlewares;
