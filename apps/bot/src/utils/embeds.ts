import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, Role } from 'discord.js';
import { calculateLevelFromXP } from '~/services/levels';

export class CustomEmbedBuilder extends EmbedBuilder {
  addField(name: string, value: string, inline = false) {
    return this.addFields({ name, value, inline });
  }
}

export function createEmbed() {
  return new CustomEmbedBuilder().setFooter({
    text: '♡ from fabra - 𝔬𝔩𝔦𝔳𝔢𝔯 𝔣𝔞𝔪𝔦𝔩𝔦𝔞',
  });
}

export function createLevelUpEmbed(userId: string, xp: number, newRole?: Role) {
  const level = calculateLevelFromXP(xp);

  const embed = createEmbed()
    .setColor('#2B2D31')
    .setTitle('🎉 Level Up! 🎉')
    .setDescription(`Congratulations, <@${userId}>! You've leveled up!`)
    .addFields(
      { name: '📈 New Level', value: `${level}`, inline: true },
      { name: '🌟 Total XP', value: `${xp} XP`, inline: true },
      ...(newRole ? [{ name: '🎭 New Role', value: `You have unlocked the role ${newRole.name}` }] : []),
    )
    .setTimestamp();

  return embed;
}

export function createTicketButtonEmbed() {
  return createEmbed()
    .setTitle('🎫 Support Ticket')
    .setDescription('Click the button below to create a support ticket.')
    .setColor('#2B2D31');
}
export function createVerificationButtonEmbed() {
  return createEmbed()
    .setTitle('🔑 Verification')
    .setDescription('Click the button below to verify your account.')
    .setColor('#2B2D31');
}

export function createTicketEmbed(ticketId: string, userId: string) {
  return createEmbed()
    .setTitle('🎫 | New Ticket Created')
    .setDescription(
      `Hello <@${userId}>, your ticket has been successfully created! A staff member will be with you shortly to assist with your issue.`,
    )
    .addFields({ name: '🎟️ Ticket ID', value: ticketId }, { name: '📅 Created On', value: new Date().toLocaleString() });
}

export function createTicketButtons(ticketId: string, isClosed = false) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`close-ticket-${ticketId}`)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isClosed),
    new ButtonBuilder().setCustomId(`delete-ticket-${ticketId}`).setLabel('Delete Ticket').setStyle(ButtonStyle.Danger),
  );
}

export function createRoleSelectorEmbed() {
  return createEmbed()
    .setTitle('🎨 Color Role Selector')
    .setDescription('Select a color role from the options below.')
    .setColor('#2B2D31');
}

export function createAuditLogEmbed(
  props: {
    type: string;
    user: string;
    target?: string;
    reason?: string;
  } & Record<string, string>,
) {
  const extraFields = Object.entries(props)
    .filter(([key]) => !['type', 'user', 'target', 'reason'].includes(key))
    .map(([key, value]) => ({ name: key, value }));

  return createEmbed()
    .setTitle(`🔍 ${props.type} Log`)
    .setDescription('View the latest moderation actions taken in the server.')
    .setColor('#2B2D31')
    .addFields(
      { name: '👤 User', value: `<@${props.user}>`, inline: true },
      { name: '🎯 Target', value: props.target || 'N/A' },
      { name: '📄 Reason', value: props.reason || 'N/A' },
      ...extraFields,
    )
    .setTimestamp();
}

export function createVerificationTokenEmbed(token: string, userId: string, username: string) {
  return createEmbed()
    .setTitle('🔑 Verification Token')
    .setDescription(`Hello <@${userId}>, please wait for a staff member to assist you with the verification process.`)
    .setColor('#2B2D31')
    .addField('🔒 Token', `||${token}||`)
    .addField('🎮 In-Game Username', username);
}

export function createVerificationTokenInstructionsEmbed(
  token: string,
  userId: string,
  username: string,
  staffUsername: string,
) {
  return createEmbed()
    .setTitle('🔑 Verification Instructions')
    .setDescription(`Hello <@${userId}>, please wait for a staff member to assist you with the verification process.`)
    .setColor('#2B2D31')
    .addFields(
      { name: '🔒 Token', value: `||${token}||` },
      { name: '🎮 In-Game Username', value: username },
      { name: '1️⃣ Step 1', value: 'Copy the token above.' },
      { name: '2️⃣ Step 2', value: `Send a private message in-game to ${staffUsername} with the token.` },
      { name: '3️⃣ Step 3', value: 'Wait for the staff member to verify your account.' },
    );
}

export function createVerificationTokenAcceptDenyButtons(ticketId: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`verify-user-${ticketId}`).setLabel('Verify User').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject-user-${ticketId}`).setLabel('Reject User').setStyle(ButtonStyle.Danger),
  );
}

export function createVerificationClaimButton(ticketId: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`claim-verification-${ticketId}`)
      .setLabel('Claim Verification')
      .setStyle(ButtonStyle.Primary),
  );
}

export function createVerificationAcceptedOrDeniedEmbed(isAccepted: boolean, user: string) {
  return createEmbed()
    .setTitle('🔑 Verification Status')
    .setDescription(`Hello <@${user}>, your verification status in 𝔬𝔩𝔦𝔳𝔢𝔯 𝔣𝔞𝔪𝔦𝔩𝔦𝔞 has been changed`)
    .setColor(isAccepted ? '#2B2D31' : '#FF0000')
    .addField('🔒 Status', isAccepted ? 'Accepted' : 'Denied');
}

export function createConfirmationEmbed(action: string, description?: string) {
  return createEmbed()
    .setTitle(`🔒 ${action}`)
    .setDescription(description || '')
    .setColor('#2B2D31');
}

export function createServerUpdateEmbed(
  version: string,
  description = 'View the latest updates and changes made to the server.',
) {
  return createEmbed()
    .setTitle(`🔧 Server Update v${version}`)
    .setDescription(description)
    .setColor('#2B2D31')
    .setTimestamp();
}

export function createFormModal(title: string) {
  return new ModalBuilder().setTitle(title);
}
