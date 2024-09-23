import type { ApiKey } from '@prisma/client';
import { isGuildBasedChannel, isTextBasedChannel } from '@sapphire/discord.js-utilities';
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { OliverCommand } from '~/client';
import { createAPIKey, deleteAPIKey, deleteAllKeys, getAPIKey, getAPIKeys } from '~/services/key';
import { createEmbed } from '~/utils/embeds';

export default class Command extends OliverCommand {
  constructor() {
    super({
      name: 'key',
      description: 'Get your API keys for the API',
      category: 'api',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand
          .setName('get')
          .setDescription('Get your API keys')
          .addStringOption((option) =>
            option.setName('key').setDescription('The key to get').setRequired(false).setAutocomplete(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('create')
          .setDescription('Create a new API key')
          .addStringOption((option) =>
            option.setName('prefix').setDescription('The prefix for the API key').setRequired(true).addChoices(
              {
                name: 'Test',
                value: 'test',
              },
              {
                name: 'Production',
                value: 'prod',
              },
            ),
          )
          .addStringOption((option) =>
            option.setName('name').setDescription('The name for the API key').setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('delete')
          .setDescription('Delete an API key')
          .addStringOption((option) =>
            option.setName('key').setDescription('The key to delete').setRequired(true).setAutocomplete(true),
          ),
      )
      .addSubcommand((subcommand) => subcommand.setName('delete-all').setDescription('Delete all API keys'));
  }

  public async autocomplete(interaction: AutocompleteInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'delete' || subcommand === 'get') {
      const keys = await getAPIKeys(interaction.user.id);

      const maxKeys = 25;
      const mappedKeys = keys.map((key) => ({ name: key.key, value: key.key })).slice(0, maxKeys);

      return interaction.respond(mappedKeys);
    }

    return interaction.respond([]);
  }

  public async run(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'get') {
      if (interaction.options.getString('key', false)) {
        return this.getKey(interaction);
      }

      return this.getKeys(interaction);
    }
    if (subcommand === 'create') {
      return this.createKey(interaction);
    }
    if (subcommand === 'delete') {
      return this.deleteKey(interaction);
    }
    if (subcommand === 'delete-all') {
      if (!isTextBasedChannel(interaction.channel) || !isGuildBasedChannel(interaction.channel)) {
        return interaction.reply({ content: 'This command can only be used in a server', ephemeral: true });
      }
      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('local:confirm-delete-keys').setLabel('Confirm').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('local:cancel-delete-keys').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      );

      const confirmation = await interaction.reply({
        content: 'Are you sure you want to delete all your API keys?',
        components: [buttons],
        ephemeral: true,
      });

      const collector = interaction.channel.createMessageComponentCollector({
        filter: (ctx) =>
          ctx.user.id === interaction.user.id &&
          ctx.isButton() &&
          ['local:confirm-delete-keys', 'local:cancel-delete-keys'].includes(ctx.customId),
        time: 30000,
      });

      let isTimedOut = true;
      collector.on('collect', async (ctx) => {
        let msg = 'The action has been cancelled';
        if (ctx.customId === 'local:confirm-delete-keys') {
          await this.deleteAllKeys(interaction, false);
          msg = 'All API keys have been deleted';
        }

        await confirmation.edit({ components: [], content: msg });

        isTimedOut = false;
        await ctx.deferUpdate();
        collector.stop();
      });

      collector.on('end', async () => {
        if (isTimedOut) {
          await interaction.editReply({ components: [], content: 'The action has been cancelled' }).catch(() => null);
        }
      });

      return;
    }

    return interaction.reply({ content: 'Invalid subcommand', ephemeral: true });
  }

  private async getKey(interaction: ChatInputCommandInteraction) {
    const key = await getAPIKey(interaction.options.getString('key', true));

    if (!key) {
      return interaction.reply({ content: 'Invalid key', ephemeral: true });
    }

    const embed = await this.getKeyEmbed(key);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async getKeys(interaction: ChatInputCommandInteraction) {
    const keys = await getAPIKeys(interaction.user.id);

    if (!keys.length) {
      return interaction.reply({ content: "You don't have any API keys", ephemeral: true });
    }

    const embed = await this.getKeysEmbed(keys);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async createKey(interaction: ChatInputCommandInteraction) {
    const prefix = interaction.options.getString('prefix', true);
    const name = interaction.options.getString('name', false);

    const key = await createAPIKey(interaction.user.id, prefix as 'test' | 'prod', name);

    if (!key) {
      return interaction.reply({ content: 'Failed to create an API key', ephemeral: true });
    }

    if (typeof key === 'string') {
      return interaction.reply({ content: key, ephemeral: true });
    }

    const embed = await this.createKeyEmbed(key);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async deleteKey(interaction: ChatInputCommandInteraction) {
    const key = interaction.options.getString('key', true);
    const deleted = await deleteAPIKey(interaction.user.id, key);

    if (!deleted) {
      return interaction.reply({ content: 'Failed to delete the API key', ephemeral: true });
    }

    const embed = await this.deleteKeyEmbed(key);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async deleteAllKeys(interaction: ChatInputCommandInteraction, reply = true) {
    const deleted = await deleteAllKeys(interaction.user.id);

    if (!deleted) {
      return interaction.reply({ content: 'Failed to delete all API keys', ephemeral: true });
    }

    const embed = createEmbed()
      .setTitle('🔑 API Keys')
      .setDescription('All API keys have been deleted\n\nYou can create a new one with `/key create`');
    if (reply) await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async getKeyEmbed(key: ApiKey) {
    return createEmbed()
      .setTitle('🔑 API Key')
      .setDescription(
        `This is your API key\n\n- Name: ${key.name ?? 'Unnamed'}\n- Key: ${key.key}\n- Expires <t:${Math.floor(
          key.expires.getTime() / 1000,
        )}:R>\n- Created: <t:${Math.floor(key.createdAt.getTime() / 1000)}:R>\n- Last used: ${
          key.lastUsed ? `<t:${Math.floor(key.lastUsed.getTime() / 1000)}:R>` : 'Never'
        }\n- Uses: ${key.uses}`,
      );
  }

  private async getKeysEmbed(keys: ApiKey[]) {
    return createEmbed()
      .setTitle('🔑 API Keys')
      .setDescription(
        `Here are your API keys\n\n${keys
          .map(
            (key, idx) =>
              `- Name: ${key.name ?? `Key #${idx + 1}`}\n- Key: \`${key.key}\`\n- Expires <t:${Math.floor(
                key.expires.getTime() / 1000,
              )}:R>\n- Created: <t:${Math.floor(key.createdAt.getTime() / 1000)}:R>\n- Uses: ${key.uses}`,
          )
          .join('\n\n')}`,
      );
  }

  private async createKeyEmbed(key: ApiKey) {
    return createEmbed()
      .setTitle('🔑 API Key')
      .setDescription(
        `This is your new API key\n\n- Name: ${key.name ?? 'Unnamed'}\n- Key: ${key.key}\n- Expires <t:${Math.floor(
          key.expires.getTime() / 1000,
        )}:R>\n- Created: <t:${Math.floor(key.createdAt.getTime() / 1000)}:R>\n- Last used: Never\n- Uses: 0`,
      );
  }

  private async deleteKeyEmbed(key: string) {
    return createEmbed()
      .setTitle('🔑 API Key')
      .setDescription(`The API key \`${key}\` has been deleted\n\nYou can create a new one with \`/key create\``);
  }
}
