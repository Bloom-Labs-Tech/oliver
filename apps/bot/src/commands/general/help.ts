import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { type CommandJSON, OliverCommand } from '~/client';
import { capitalize } from '../../utils/helpers';

export default class Help extends OliverCommand {
  constructor() {
    super({
      name: 'help',
      description: 'Get help with using the bot',
      category: 'general',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  public async run(interaction: ChatInputCommandInteraction) {
    const categories = this.getCommandCategories();
    const selectMenu = this.createCategorySelectMenu(categories);

    const row = (menu: StringSelectMenuBuilder) => new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    await interaction.reply({
      components: [row(selectMenu)],
    });

    if (!isGuildBasedChannel(interaction.channel)) {
      return interaction.editReply({ content: 'This command only works in a server.' });
    }

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000, // Collector will stop after 60 seconds
    });

    collector?.on('collect', async (menuInteraction) => {
      if (menuInteraction.user.id !== interaction.user.id) {
        return await menuInteraction.reply({ content: "You can't interact with this menu.", ephemeral: true });
      }

      const selectedCategory = menuInteraction.values[0];
      const commands = this.getCommandsByCategory(selectedCategory);

      const embed = this.formatEmbed(commands, selectedCategory);
      await menuInteraction.update({
        embeds: [embed],
        components: [row(this.createCategorySelectMenu(categories, capitalize(selectedCategory)))],
      });
    });

    collector?.on('end', async () => {
      if (interaction.channel) {
        await interaction.deleteReply();
      }
    });
  }

  private getCommandCategories(): string[] {
    const commands = Array.from(this.client.commandHandler.commands.values());
    const categories = [...new Set(commands.map((command) => command.category))];
    return categories;
  }

  private createCategorySelectMenu(
    categories: string[],
    placeholder = 'Select a command category',
  ): StringSelectMenuBuilder {
    return new StringSelectMenuBuilder()
      .setCustomId('select-category')
      .setPlaceholder(placeholder)
      .addOptions(
        categories.map((category) => ({
          label: category.charAt(0).toUpperCase() + category.slice(1),
          value: category,
        })),
      );
  }

  private getCommandsByCategory(category: string): CommandJSON[] {
    const commands = Array.from(this.client.commandHandler.commands.values());
    return commands.filter((command) => command.category === category).map((command) => command.toJSONHelp());
  }

  private formatEmbed(commands: CommandJSON[], category: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
      .setDescription(`Here are the commands you can use in the **${category}** category:`)
      .setColor('#00FF00'); // Customize the color as per your theme

    for (const command of commands) {
      let value = `${command.description}`;
      if (command.examples.length > 0) {
        value += `\n\n**Examples:**\n${command.examples.map((example) => `- \`${example}\``).join('\n')}`;
      }

      embed.addFields({
        name: `\`/${command.name}\``,
        value: value,
        inline: false,
      });
    }

    return embed;
  }
}
