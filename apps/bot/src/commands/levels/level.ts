import { RankCardBuilder } from 'canvacord';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { OliverCommand } from '~/client';
import { getGuildFeature } from '~/services/common';
import { calculateLevelFromXP, calculateXPForNextLevel } from '~/services/levels';

export default class Level extends OliverCommand {
  constructor() {
    super({
      name: 'level',
      description: "Check a user's level",
      category: 'levels',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption((option) =>
        option.setName('user').setDescription('The user to check the level of').setRequired(false),
      );
  }

  public async run(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild)
      return interaction.reply({ content: 'This command can only be used in a server', ephemeral: true });
    const user = interaction.options.getUser('user') || interaction.user;

    const feature = await getGuildFeature(interaction.guild.id, 'LEVELING', true);
    if (!feature?.isEnabled) {
      return interaction.reply({ content: 'The leveling feature is not enabled in this server', ephemeral: true });
    }

    const dbUser = await this.client.db.guildMember.findUnique({
      where: { userId_guildId: { userId: user.id, guildId: interaction.guild.id } },
    });

    if (!dbUser) {
      return interaction.reply({ content: 'This user has not sent any messages yet', ephemeral: true });
    }

    const level = calculateLevelFromXP(dbUser.xp);
    const xp = dbUser.xp;
    const nextLevelXP = calculateXPForNextLevel(level);

    const rank = new RankCardBuilder()
      .setAvatar(user.displayAvatarURL())
      .setCurrentXP(xp)
      .setRequiredXP(nextLevelXP)
      .setLevel(level)
      .setUsername(user.username);

    const image = await rank.build();

    await interaction.reply({ files: [image] });
  }
}
