import { OliverEvent } from '~/client';
import { client } from '~/index';

export default class OliverReadyEvent extends OliverEvent<'ready'> {
  public constructor() {
    super('ready', {
      runOnce: true,
    });
  }

  public async execute() {
    client.logger.info(`Logged in as ${client.user?.tag}`);
  }
}
