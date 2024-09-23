import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { OliverCommand } from '~/client';
import middlewares from '../../middlewares';
import { OliverError } from '../../utils/errors';

export default class Reload extends OliverCommand {
  constructor() {
    super({
      name: 'reload',
      description: 'Reload all commands',
      middlewares: [middlewares.devOnly],
      category: 'developer',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  public async run(interaction: ChatInputCommandInteraction) {
    try {
      await this.client.commandHandler.reloadCommands();
      await interaction.reply({ content: 'All commands have been reloaded successfully!', ephemeral: true });
    } catch (error) {
      await interaction.reply({
        content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
        ephemeral: true,
      });
    }
  }
}
