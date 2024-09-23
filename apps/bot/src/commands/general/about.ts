import type { ChatInputCommandInteraction } from 'discord.js';
import { OliverCommand } from '~/client';

export default class Command extends OliverCommand {
  constructor() {
    super({
      name: 'about',
      description: 'Get information about the bot.',
      category: 'general',
    });
  }

  public async run(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: `Oliver is a Discord bot created by fabra. It is a simple bot that is designed to help you with your server needs. You can view the source code of the bot [here](
      https://github.com/ivanoliverfabra/oliver-bot).`,
    });
  }
}
