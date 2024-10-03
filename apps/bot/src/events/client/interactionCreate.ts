import { isGuildBasedChannel, isTextChannel } from '@sapphire/discord.js-utilities';
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonInteraction,
  CommandInteraction,
  ComponentType,
  type Interaction,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { OliverCommand, OliverEvent } from '~/client';
import { TicketActions, type TicketActionsType, VerificationActions, getGuildFeature, isTicketAction } from '~/services/common';
import { handleLevelUp } from '~/services/levels';
import {
  claimVerificationTicket,
  closeTicket,
  createTicket,
  createVerificationTicket,
  generateVerificationCode,
  verifyUserTicket,
} from '~/services/tickets';
import {
  createFormModal,
  createServerUpdateEmbed,
  createTicketButtons,
  createTicketEmbed,
  createVerificationClaimButton,
  createVerificationTokenEmbed,
} from '../../utils/embeds';
import { OliverError } from '../../utils/errors';

export default class OliverReadyEvent extends OliverEvent<'interactionCreate'> {
  public constructor() {
    super('interactionCreate', {
      runOnce: false,
    });
  }

  public async execute(interaction: Interaction): Promise<void> {
    if (interaction.isCommand()) {
      return await this.handleCommand(interaction);
    }
    if (interaction.isAutocomplete()) {
      return await this.handleAutocomplete(interaction);
    }
    if (interaction.customId.startsWith('local:')) {
      return;
    }
    if (interaction.isButton()) {
      return await this.handleButtonInteraction(interaction);
    }
    if (interaction.isModalSubmit()) {
      return await this.handleModalSubmit(interaction);
    }
  }

  private async handleAutocomplete(interaction: AutocompleteInteraction) {
    const command = this.client.commandHandler.commands.get(interaction.commandName);
    if (!command) {
      this.client.logger.warn(`Command not found: ${interaction.commandName}`);
      return;
    }

    try {
      await OliverCommand.runAutocomplete(command, interaction);
    } catch (error) {
      this.client.logger.error(`Failed to execute autocomplete: ${interaction.commandName}`, error);
      await interaction.respond([]);
    }
  }

  private async handleModalSubmit(interaction: ModalSubmitInteraction) {
    if (interaction.customId === 'send-update-form') {
      return this.submitServerUpdateInteraction(interaction);
    }
    if (interaction.customId === VerificationActions.Verify) {
      return this.submitVerificationInteraction(interaction);
    }
  }

  private async submitVerificationInteraction(interaction: ModalSubmitInteraction) {
    try {
      const username = interaction.fields.getField('username', ComponentType.TextInput)?.value;
      if (!username) {
        throw new OliverError('Missing required fields');
      }

      if (!interaction.guild) {
        throw new OliverError('Guild not found');
      }

      const feature = await getGuildFeature(interaction.guild.id, 'LEGENDOFMUSHROOM', true);
      if (!feature?.isEnabled || !feature.data.verification.isEnabled) {
        throw new OliverError('Verification feature is not enabled.');
      }

      const newVerificationCode = generateVerificationCode();
      await this.client.db.user.upsert({
        where: {
          id: interaction.user.id,
        },
        update: {
          lomVerificationCode: newVerificationCode,
        },
        create: {
          id: interaction.user.id,
          lomVerificationCode: newVerificationCode,
        },
      });

      const embed = createVerificationTokenEmbed(newVerificationCode, interaction.user.id, username);
      const { channel, ticket } = await createVerificationTicket(
        interaction.user.id,
        interaction.guild.id,
        username,
      );

      if (!channel || !ticket) {
        throw new OliverError('Failed to create a ticket.');
      }

      const buttons = createVerificationClaimButton(ticket.id);
      const officerRoles = this.client.cached[interaction.guild.id].roles.filter(
        (role) => 'func' in role && role.func === 'ADMIN',
      );

      await channel.send({
        content: officerRoles.map((role) => `<@&${role.id}>`).join(' '),
        embeds: [embed],
        components: [buttons],
      });

      await interaction.reply({
        content: `A ticket has been created for you. Please check <#${channel.id}> for further instructions.`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction
        .reply({
          content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async submitServerUpdateInteraction(interaction: ModalSubmitInteraction) {
    try {
      const channelId = interaction.fields.getField('channel', ComponentType.TextInput)?.value;
      const version = interaction.fields.getField('version', ComponentType.TextInput)?.value;
      const description = interaction.fields.getField('description', ComponentType.TextInput)?.value;
      if (!channelId || !version || !description) {
        throw new OliverError('Missing required fields');
      }

      const guild = interaction.guild;
      if (!guild) throw new OliverError('Guild not found');

      const channel = guild.channels.cache.get(channelId);
      if (!isTextChannel(channel) || !isGuildBasedChannel(channel)) throw new OliverError('Channel not found');

      const embed = createServerUpdateEmbed(version, description);

      await channel.send({
        embeds: [embed],
      });

      await interaction.reply({
        content: 'Server update has been sent successfully!',
        ephemeral: true,
      });
    } catch (error) {
      this.client.logger.error('Failed to submit server update', error);
      await interaction
        .reply({
          content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async handleCommand(interaction: CommandInteraction) {
    const command = this.client.commandHandler.commands.get(interaction.commandName);

    if (!command) {
      this.client.logger.warn(`Command not found: ${interaction.commandName}`);
      return;
    }

    await handleLevelUp(interaction).catch(() => null);

    try {
      await OliverCommand.runCommand(command, interaction);
    } catch (error) {
      this.client.logger.error(`Failed to execute command: ${interaction.commandName}`, error);
      await interaction
        .reply({
          content: 'There was an error executing this command!',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async handleButtonInteraction(interaction: ButtonInteraction) {
    if (isTicketAction(interaction.customId)) {
      return this.handleTicketButtonInteractions(interaction);
    }

    await interaction.reply({
      content: 'This action is not supported.',
      ephemeral: true,
    });
  }

  private async handleTicketButtonInteractions(interaction: ButtonInteraction) {
    const { customId } = interaction;

    if (!isTicketAction(customId)) {
      return;
    }

    if (customId.startsWith(TicketActions.Create)) {
      return this.handleTicketCreate(customId, interaction);
    }
    if (customId.startsWith(TicketActions.Close)) {
      return this.handleTicketClose(customId, interaction);
    }
    if (customId.startsWith(TicketActions.Delete)) {
      await this.requireAdmin(interaction);
      return this.handleTicketClose(customId, interaction, true);
    }
    if (customId === VerificationActions.Verify) {
      return this.handleVerificationButton(interaction);
    }
    if (customId.startsWith(VerificationActions.ClaimVerification)) {
      await this.requireAdmin(interaction);
      return this.handleTicketClaimVerification(interaction);
    }
    if (customId.startsWith(VerificationActions.VerifyUser)) {
      await this.requireAdmin(interaction);
      return this.handleTicketVerifyUser(interaction);
    }
    if (customId.startsWith(VerificationActions.RejectUser)) {
      await this.requireAdmin(interaction);
      return this.handleTicketClose(customId, interaction, true);
    }

    await interaction.reply({
      content: 'This action is not supported.',
      ephemeral: true,
    });
  }

  private async handleVerificationButton(interaction: ButtonInteraction) {
    try {
      const form = createFormModal('🔑 Verification').setCustomId(VerificationActions.Verify);
      const usernameInput = new TextInputBuilder()
        .setCustomId('username')
        .setLabel('Username')
        .setPlaceholder('Enter the username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput);
      form.addComponents(row);

      await interaction.showModal(form);
    } catch (error) {
      await interaction
        .reply({
          content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async handleTicketCreate(customId: TicketActionsType, interaction: ButtonInteraction) {
    try {
      const ticketType = customId.split('-').pop();
      if (!ticketType) throw new OliverError('Ticket type not found');
      if (!interaction.guild) throw new OliverError('Guild not found');

      const { channel, ticket } = await createTicket(interaction.user.id, interaction.guild.id, 'TICKET');
      if (!channel || !ticket) throw new OliverError('Failed to create a ticket.');

      const embed = createTicketEmbed(ticketType, interaction.user.id);
      const buttons = createTicketButtons(ticket.id);

      await channel.send({
        embeds: [embed],
        components: [buttons],
      });

      await interaction.reply({
        content: `A ticket has been created for you. Please check <#${channel.id}> for further instructions.`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction
        .reply({
          content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async handleTicketClose(customId: TicketActionsType, interaction: ButtonInteraction, deleteChannel = false) {
    try {
      const ticketId = customId.split('-').pop();
      if (!ticketId) throw new OliverError('Ticket ID not found');

      const isClosed = await closeTicket(ticketId, deleteChannel);
      if (!isClosed) throw new OliverError('Failed to close ticket');

      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'Ticket has been closed successfully!',
          ephemeral: true,
        });
      }
    } catch (error) {
      await interaction
        .reply({
          content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async handleTicketClaimVerification(interaction: ButtonInteraction) {
    try {
      const ticketId = interaction.customId.split('-').pop();
      if (!ticketId) throw new OliverError('Ticket ID not found');

      const isClaimed = await claimVerificationTicket(ticketId, interaction.user.id);
      if (!isClaimed) throw new OliverError('Failed to claim ticket');

      await interaction.reply({
        content: 'Ticket has been claimed successfully!',
        ephemeral: true,
      });
    } catch (error) {
      await interaction
        .reply({
          content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async handleTicketVerifyUser(interaction: ButtonInteraction) {
    try {
      const ticketId = interaction.customId.split('-').pop();
      if (!ticketId) throw new OliverError('Ticket ID not found');

      const isVerified = await verifyUserTicket(ticketId);
      if (!isVerified) throw new OliverError('Failed to verify user');

      await interaction.reply({
        content: 'User has been verified successfully!',
        ephemeral: true,
      });
    } catch (error) {
      await interaction
        .reply({
          content: error instanceof OliverError ? error.message : 'There was an error executing this command.',
          ephemeral: true,
        })
        .catch(() => null);
    }
  }

  private async isAdmin(interaction: Interaction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    const officerRoles = this.client.cached[interaction.guild?.id || ''].roles.filter(
      (role) => 'func' in role && role.func === 'ADMIN',
    );
    return (
      member?.permissions.has('Administrator') ||
      member?.roles.cache.some((role) => role.permissions.has('Administrator')) ||
      officerRoles.some((role) => member?.roles.cache.has(role.id))
    );
  }

  private async requireAdmin(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    if (!(await this.isAdmin(interaction))) {
      await interaction.reply({
        content: 'You do not have permission to execute this command.',
        ephemeral: true,
      });
    }
  }
}
