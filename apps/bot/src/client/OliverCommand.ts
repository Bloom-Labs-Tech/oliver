import {
  ApplicationCommandType,
  AutocompleteInteraction,
  type ChatInputApplicationCommandData,
  CommandInteraction,
  InteractionResponse,
  Message,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { getGuildFeature } from '~/services/common';
import { client } from '..';
import { MiddlewareNotPassedError, OliverError } from '../utils/errors';
import type { OliverMiddleware } from './OliverMiddleware';

export type CommandBuilder =
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandBuilder
  | SlashCommandSubcommandBuilder;
type CommandResponse =
  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  | Promise<Message<boolean> | InteractionResponse | undefined | void>
  | Message<boolean>
  | InteractionResponse
  | undefined
  | void;

export type CommandJSON = {
  name: string;
  description: string;
  examples: string[];
  category: string;
};

type CommandOptions = {
  name: string;
  description: string;
  category?: string;
  examples?: string[];
  middlewares?: OliverMiddleware | OliverMiddleware[];
};

export abstract class OliverCommand {
  public readonly client = client;
  public readonly name: string;
  public readonly description: string;
  public readonly category: string;
  public readonly examples: string[];
  public middlewares?: OliverMiddleware | OliverMiddleware[];

  constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.category = options.category || 'other';
    this.examples = options.examples || [];
    this.middlewares = options.middlewares || [];
  }

  public registerApplicationCommands(): CommandBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  public abstract run(interaction: CommandInteraction): CommandResponse;

  public autocomplete(interaction: AutocompleteInteraction): CommandResponse {
    if (interaction.responded) {
      return;
    }

    return interaction.respond([]);
  }

  private static async runMiddlewares(commandInstance: OliverCommand, interaction: CommandInteraction): Promise<true> {
    if (!commandInstance.middlewares) {
      return true;
    }

    if (!Array.isArray(commandInstance.middlewares)) {
      commandInstance.middlewares = [commandInstance.middlewares];
    }

    for (const middleware of commandInstance.middlewares) {
      const passed = await middleware.run(interaction);
      if (!passed) {
        throw new MiddlewareNotPassedError();
      }
    }
    return true; // All middlewares passed
  }

  private static async isCommandEnabled(
    commandInstance: OliverCommand,
    interaction: CommandInteraction,
  ): Promise<boolean> {
    if (!interaction.guild) return true;

    const feature = await getGuildFeature(interaction.guild.id, 'COMMANDS', true);
    if (!feature?.isEnabled) {
      return false;
    }

    if (commandInstance.name in feature.data) {
      return feature.data[commandInstance.name as keyof typeof feature.data] ?? true;
    }

    return true;
  }

  public static async runCommand(commandInstance: OliverCommand, interaction: CommandInteraction): Promise<void> {
    try {
      const isEnabled = await OliverCommand.isCommandEnabled(commandInstance, interaction);
      if (!isEnabled) throw new OliverError('This command is disabled in this server.');
      await OliverCommand.runMiddlewares(commandInstance, interaction);
      await commandInstance.run(interaction);
    } catch (error) {
      client.logger.error('Error running command', error);
      await interaction.reply({
        content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
        ephemeral: true,
      });
    }
  }

  public static async runAutocomplete(
    commandInstance: OliverCommand,
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    try {
      if (interaction.responded) {
        return;
      }
      await commandInstance.autocomplete(interaction);
    } catch (error) {
      client.logger.error('Error running autocomplete', error);
      await interaction.respond([]);
    }
  }

  public toJSONHelp(): CommandJSON {
    return {
      name: this.name,
      description: this.description,
      examples: this.examples,
      category: this.category,
    };
  }

  public toJSON(): ChatInputApplicationCommandData {
    return {
      name: this.name,
      description: this.description,
      type: ApplicationCommandType.ChatInput,
    };
  }
}
