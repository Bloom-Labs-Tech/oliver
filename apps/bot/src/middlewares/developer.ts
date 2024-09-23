import { ChatInputCommandInteraction } from 'discord.js';
import { OliverMiddleware } from '~/client';

export class DeveloperMiddleware extends OliverMiddleware {
  public async run(interaction: ChatInputCommandInteraction): Promise<boolean> {
    if (interaction.member?.user.id !== '258711360236421131') {
      await interaction.reply({ content: 'You do not have permissions to use this command.', ephemeral: true });
      return false;
    }

    return true;
  }
}
