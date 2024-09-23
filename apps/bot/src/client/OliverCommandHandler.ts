import { REST, Routes } from 'discord.js';
import { OliverBot, OliverCommand } from '.';
import { env } from '../env';
import { getFiles } from '../utils/helpers';

export class CommandHandler {
  public commands: Map<string, OliverCommand> = new Map();

  constructor(private client: OliverBot) {}

  public async unregisterCommand(commandName: string): Promise<void> {
    const command = this.commands.get(commandName);
    if (!command) return;

    try {
      const applicationCommand = await this.client.application?.commands.fetch({
        guildId: env.DEVELOPMENT_GUILD_ID,
        force: true,
      });
      const commandToDelete = applicationCommand?.find((cmd) => cmd.name === commandName);
      if (commandToDelete) {
        await commandToDelete.delete();
      }
      this.commands.delete(commandName);
    } catch (error) {
      this.client.logger.error(`Failed to unregister command: ${commandName}`, error);
    }
  }

  public async unregisterCommands(): Promise<void> {
    await this.client.application?.commands.set([]);
    if (env.IS_DEVELOPMENT && env.DEVELOPMENT_GUILD_ID) {
      await this.client.application?.commands.set([], env.DEVELOPMENT_GUILD_ID);
    }

    this.commands.clear();
  }

  public async registerCommands(): Promise<void> {
    const startImporting = Date.now();

    const commandFiles = await getFiles('./src/commands');

    // Preprocess all the relative paths once
    const commandImports = commandFiles.map((file) => {
      const relativePath = `../${file.replace('src/', '')}`;
      return { file, relativePath };
    });

    // Use Promise.all to parallelize imports for all commands
    const commands: OliverCommand[] = await Promise.all(
      commandImports.map(async ({ file, relativePath }) => {
        try {
          const OliverCmd = (await import(relativePath)).default;
          if (OliverCmd && OliverCmd.prototype instanceof OliverCommand) {
            return new OliverCmd();
          }

          this.client.logger.warn(`Command file ${file} does not export a valid command class`);
        } catch (error) {
          this.client.logger.error(`Failed to register command from file ${file}`, error);
        }
        return null;
      }),
    );

    const endImporting = Date.now();
    this.client.logger.info(`Imported ${commands.length} commands in ${endImporting - startImporting}ms`);

    // Register all commands in a batch process
    const applicationCommands = commands.filter(Boolean);

    if (env.IS_DEVELOPMENT) {
      if (!env.DEVELOPMENT_GUILD_ID || !env.DISCORD_CLIENT_ID) {
        this.client.logger.error('Missing development guild ID or Discord client ID');
        return;
      }

      const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

      const commandsToRegister = applicationCommands.map((command) => command.registerApplicationCommands());
      this.client.logger.info('Registering commands in development guild');
      await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DEVELOPMENT_GUILD_ID), {
        body: commandsToRegister,
      });
      this.client.logger.info('Registered commands in development guild');
    } else {
      await this.client.application?.commands.set(applicationCommands);
    }

    this.commands = new Map(commands.map((command) => [command.name, command]));

    const endRegistering = Date.now();

    this.client.logger.info(`Registered ${this.commands.size} commands in ${endRegistering - endImporting}ms`);
  }

  public async reloadCommands(): Promise<void> {
    await this.unregisterCommands();
    await this.registerCommands();
  }
}
