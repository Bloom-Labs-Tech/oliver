import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { OliverCommand } from '~/client';
import { VerificationActions, getGuildFeature } from '~/services/common';
import middlewares from '../../middlewares';
import { createVerificationButtonEmbed } from '../../utils/embeds';
import { OliverError } from '../../utils/errors';

export default class Command extends OliverCommand {
  constructor() {
    super({
      name: 'verify',
      description: 'Send the button that allows users to verify their identity in Legend of Mushroom.',
      category: 'admin',
      middlewares: middlewares.adminOnly,
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  public async run(interaction: ChatInputCommandInteraction) {
    try {
      if (!isGuildBasedChannel(interaction.channel) || !interaction.guild) {
        return interaction.reply({ content: 'This command only works in a server.', ephemeral: true });
      }

      const feature = await getGuildFeature(interaction.guild.id, 'LEGENDOFMUSHROOM', true);
      if (!feature?.isEnabled || !feature.data.verification.isEnabled) {
        return interaction.reply({ content: 'Verification feature is not enabled.', ephemeral: true });
      }

      const button = this.createTicketButton();
      const embed = createVerificationButtonEmbed();
      await interaction.channel.send({ embeds: [embed], components: [button] });

      await interaction.reply({ content: 'Verification button created.', ephemeral: true });
    } catch (error) {
      await interaction.reply({
        content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
        ephemeral: true,
      });
    }
  }

  private createTicketButton() {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(VerificationActions.Verify).setLabel('Verify').setStyle(ButtonStyle.Primary),
    );

    return row;
  }
}
