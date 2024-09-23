import { isGuildBasedChannel, isTextChannel } from '@sapphire/discord.js-utilities';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { OliverCommand } from '~/client';
import middlewares from '../../middlewares';
import { OliverError } from '../../utils/errors';

export default class Purge extends OliverCommand {
  constructor() {
    super({
      name: 'purge',
      description: 'Clear messages from the current channel',
      category: 'admin',
      middlewares: [middlewares.adminOnly],
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option
          .setName('amount')
          .setDescription('Number of messages to clear')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100),
      );
  }

  public async run(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);
    const channel = interaction.channel;

    if (!isGuildBasedChannel(interaction.channel)) throw new OliverError('This command can only be used in a server.');
    if (!channel) throw new OliverError('Could not find the channel to clear messages.');
    if (!isTextChannel(channel)) throw new OliverError('This command can only be used in a text channel.');

    try {
      const fetchedMessages = await channel.bulkDelete(amount, true);

      await interaction.reply({
        content: `Successfully cleared ${fetchedMessages.size} messages.`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
        ephemeral: true,
      });
    }
  }
}
