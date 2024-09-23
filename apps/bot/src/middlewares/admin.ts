import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { OliverMiddleware } from '~/client';

export class AdminMiddleware extends OliverMiddleware {
  public async run(interaction: ChatInputCommandInteraction): Promise<boolean> {
    if (
      !interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages) &&
      !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator) &&
      !interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) &&
      !interaction.memberPermissions?.has(PermissionsBitField.Flags.ModerateMembers)
    ) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return false;
    }

    return true;
  }
}
