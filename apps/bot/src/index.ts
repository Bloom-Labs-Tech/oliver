import { Font } from 'canvacord';
import routes from './api';
import { OliverBot } from './client';
import './client/OliverLogger';
import { env } from './env';

Font.loadDefault();

export const client = new OliverBot();

try {
  client.logger.info('Logging in');
  await client.login();
} catch (error) {
  client.logger.error('Failed to login', error);
  process.exit(1);
}

process.on('unhandledRejection', (error) => {
  client.logger.error('Unhandled promise rejection', error);
});

export default {
  fetch: routes.fetch,
  port: env.PORT,
};
