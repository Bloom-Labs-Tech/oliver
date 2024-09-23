import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { OliverCommand } from '~/client';
import { getGuildFeature } from '~/services/common';
import middlewares from '../../middlewares';
import { createTicketButtonEmbed } from '../../utils/embeds';

export default class Ticket extends OliverCommand {
  constructor() {
    super({
      name: 'ticket',
      description: "Create a ticket button for the server's support team.",
      category: 'admin',
      middlewares: [middlewares.adminOnly],
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  public async run(interaction: ChatInputCommandInteraction) {
    if (!isGuildBasedChannel(interaction.channel) || !interaction.guild) {
      return interaction.reply({ content: 'This command only works in a server.', ephemeral: true });
    }

    const feature = await getGuildFeature(interaction.guild.id, 'TICKETS', true);
    if (!feature?.isEnabled) {
      return interaction.reply({ content: 'Ticket feature is not enabled.', ephemeral: true });
    }

    const button = this.createTicketButton();
    const embed = createTicketButtonEmbed();
    await interaction.channel.send({ embeds: [embed], components: [button] });

    await interaction.reply({ content: 'Ticket button created.', ephemeral: true });
  }

  private createTicketButton() {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('create-ticket').setLabel('Create Ticket').setStyle(ButtonStyle.Primary),
    );

    return row;
  }
}
