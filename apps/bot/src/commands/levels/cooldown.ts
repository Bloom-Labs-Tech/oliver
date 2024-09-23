import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { OliverCommand } from '~/client';
import { getGuildFeature } from '~/services/common';
import { XP_COOLDOWN } from '~/services/levels';
import { createEmbed } from '../../utils/embeds';

export default class Cooldown extends OliverCommand {
  constructor() {
    super({
      name: 'cooldown',
      description: 'See your current XP cooldown',
      category: 'levels',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  public async run(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used in a server', ephemeral: true });
    }

    const feature = await getGuildFeature(interaction.guild.id, 'LEVELING', true);
    if (!feature?.isEnabled) {
      return interaction.reply({ content: 'The leveling feature is not enabled in this server', ephemeral: true });
    }

    const user = await this.client.db.guildMember.findUnique({
      where: { userId_guildId: { userId: interaction.user.id, guildId: interaction.guild.id } },
    });

    if (!user) {
      return interaction.reply({ content: 'You have not sent any messages yet', ephemeral: true });
    }

    const cooldown = new Date(user.xpCooldown).getTime() + XP_COOLDOWN - Date.now();

    const embed = createEmbed()
      .setTitle('XP Cooldown')
      .setDescription(`Your XP cooldown is ${cooldown < 0 ? 'over' : `in ${Math.round(cooldown / 1000)} seconds`}`);

    await interaction.reply({ embeds: [embed] });
  }
}
