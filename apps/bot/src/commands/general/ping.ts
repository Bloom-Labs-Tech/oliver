import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { OliverCommand } from '~/client';

export default class Ping extends OliverCommand {
  constructor() {
    super({
      name: 'ping',
      description: "Check the bot's ping",
      category: 'general',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  public async run(interaction: ChatInputCommandInteraction) {
    const msg = await interaction.reply({ content: 'Looking for the ping...', ephemeral: true, fetchReply: true });

    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(interaction.client.ws.ping);
      return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
    }

    return interaction.editReply('Failed to retrieve ping :(');
  }
}
