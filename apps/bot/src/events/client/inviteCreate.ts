import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import type { Invite } from 'discord.js';
import { OliverEvent } from '~/client';

export default class Event extends OliverEvent<'inviteCreate'> {
  public constructor() {
    super('inviteCreate', {
      runOnce: false,
    });
  }

  public async execute(invite: Invite) {
    if (!isGuildBasedChannel(invite.channel) || !invite?.guild) return;
    await this.client.db.invite.create({
      data: {
        code: invite.code,
        channelId: invite.channel.id,
        guildId: invite.guild.id,
        userId: invite.inviter?.id,
      },
    });
  }
}
