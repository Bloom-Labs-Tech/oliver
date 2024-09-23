import { LeaderboardBuilder } from 'canvacord';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { OliverCommand } from '~/client';
import { getGuildFeature } from '~/services/common';
import { calculateLevelFromXP } from '~/services/levels';
import { OliverError } from '../../utils/errors';

export default class Leaderboard extends OliverCommand {
  constructor() {
    super({
      name: 'leaderboard',
      description: "See the server's leaderboard",
      category: 'levels',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option.setName('page').setDescription('The page of the leaderboard to view').setRequired(false),
      );
  }

  public async run(interaction: ChatInputCommandInteraction) {
    try {
      const page = interaction.options.getInteger('page', false) || 1;
      const leaderboard = await this.createLeaderboard(interaction, page);

      if (!interaction.guild) throw new OliverError('Guild not found');

      const feature = await getGuildFeature(interaction.guild.id, 'LEVELING', true);
      if (!feature?.isEnabled) {
        return interaction.reply({ content: 'The leveling feature is not enabled in this server', ephemeral: true });
      }

      await interaction.reply({ files: [leaderboard] });
    } catch (error) {
      await interaction.reply({
        content: error instanceof OliverError ? error.message : 'An error occurred',
        ephemeral: true,
      });
    }
  }

  private async createLeaderboard(interaction: ChatInputCommandInteraction, page: number) {
    if (!interaction.guild) throw new OliverError('Guild not found');
    const users = await this.client.db.guildMember.findMany({
      where: {
        deletedAt: null,
        guildId: interaction.guild.id,
      },
      orderBy: {
        xp: 'desc',
      },
      skip: (page - 1) * 10,
      take: 10,
    });

    const members = await interaction.guild?.members.fetch({ user: users.map((user) => user.userId) });

    const leaderboard = new LeaderboardBuilder().setPlayers(
      users.map((user, idx) => {
        const level = calculateLevelFromXP(user.xp);
        const xp = user.xp;
        const member = members?.get(user.userId);

        return {
          avatar: member?.user.displayAvatarURL() || '',
          displayName: member?.displayName || '',
          level,
          xp,
          rank: idx + 1,
          username: member?.user.username || '',
        };
      }),
    );

    return leaderboard.build();
  }
}
