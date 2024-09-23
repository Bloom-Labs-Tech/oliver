import type { Invite } from 'discord.js';
import { OliverEvent } from '~/client';

export default class Event extends OliverEvent<'inviteDelete'> {
  public constructor() {
    super('inviteDelete', {
      runOnce: false,
    });
  }

  public async execute(invite: Invite) {
    await this.client.db.invite.delete({
      where: { code: invite.code },
    });
  }
}
