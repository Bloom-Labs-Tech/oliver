import { type Channel as DBChannel, ChannelType as DBChannelType, type Role as DBRole } from '@prisma/client';
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import {
  ActivityType,
  ChannelType,
  Client,
  Collection,
  Guild,
  GuildMember,
  Invite,
  type NonThreadGuildBasedChannel,
  Partials,
  Role,
} from 'discord.js';
import { env } from '~/env';
import { db } from '~/prisma';
import { getYoutubeCookie } from '~/utils/cookies';
import { CommandHandler } from './OliverCommandHandler';
import { EventHandler } from './OliverEventHandler';
import OliverInviteTracker from './OliverInviteTracker';
import { OliverLogger } from './OliverLogger';

type ClientOptions = {
  addServerRoles?: boolean;
  addChannels?: boolean;
};

type CachedData = {
  channels: DBChannel[];
  roles: DBRole[];
};

export class OliverBot extends Client {
  public db = db;
  public commandHandler: CommandHandler = new CommandHandler(this);
  public eventHandler: EventHandler = new EventHandler(this);
  public inviteTracker: OliverInviteTracker = new OliverInviteTracker(this);
  public logger: OliverLogger = OliverLogger.getInstance();

  public cached: Record<string, CachedData> = {};

  constructor() {
    super({
      intents: [
        'GuildMembers',
        'Guilds',
        'GuildMessages',
        'MessageContent',
        'GuildInvites',
        'GuildVoiceStates',
        'GuildEmojisAndStickers',
      ],
      partials: [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message, Partials.GuildScheduledEvent],
      presence: {
        activities: [
          {
            name: 'Tending to the garden',
            type: ActivityType.Custom,
          },
        ],
      },
      shards: 'auto',
      allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true,
      },
      shardCount: 3,
    });
  }

  async login(_token?: string, options?: ClientOptions): Promise<string> {
    return this.init(options);
  }

  async init(_?: ClientOptions): Promise<string> {
    await getYoutubeCookie();
    // const options = { ...defaultOptions, ...clientOptions };
    await super.login(env.DISCORD_TOKEN);

    this.on('ready', async () => {
      await this.eventHandler.registerEvents();
      await this.cacheGuilds();
      await this.commandHandler.registerCommands();
      await this.deleteNonExistentGuilds();
      await this.deleteNonExistentChannels();
      await this.deleteNonExistentRoles();
    });

    this.inviteTracker.on('guildMemberAdd', async (member, inviter, invite, error) => {
      if (error) {
        this.logger.error(`Error while tracking invite for ${member.user.tag}: ${error}`);
        return;
      }

      await this.db.invite
        .update({
          where: { code: invite.code ?? '' },
          data: { uses: invite.count ? invite.count : { increment: 1 } },
        })
        .catch(() => null);

      this.logger.info(
        `User ${member.user.tag} joined ${member.guild.name} with invite ${invite.code} from ${inviter?.tag}`,
        {
          guild: member.guild.id,
          user: member.id,
          inviter: inviter?.id,
          invite: invite.code,
        },
      );

      await this.db.guildMember.upsert({
        where: { userId_guildId: { guildId: member.guild.id, userId: member.id } },
        update: {
          guildId: member.guild.id,
        },
        create: {
          guildId: member.guild.id,
          userId: member.id,
        },
      });

      this.logger.info(`User ${member.user.tag} joined ${member.guild.name} with invite ${invite.code}`);
    });

    return env.DISCORD_TOKEN;
  }

  private async deleteNonExistentGuilds() {
    const dbGuilds = await this.db.guild.findMany();
    const guilds = this.guilds.cache;

    const missingGuilds = dbGuilds.filter((dbGuild) => !guilds.has(dbGuild.id));

    await Promise.all(
      missingGuilds.map(async (guild) => {
        await this.db.guild.delete({
          where: {
            id: guild.id,
          },
        });
      }),
    );
  }

  private async deleteNonExistentChannels() {
    const dbChannels = await this.db.channel.findMany();
    const guilds = this.guilds.cache;

    await Promise.all(
      dbChannels.map(async (dbChannel) => {
        const guild = guilds.get(dbChannel.guildId);

        if (!guild) {
          await this.db.channel.delete({
            where: {
              id: dbChannel.id,
            },
          });
        }
      }),
    );
  }

  private async deleteNonExistentRoles() {
    const dbRoles = await this.db.role.findMany();
    const guilds = this.guilds.cache;

    await Promise.all(
      dbRoles.map(async (dbRole) => {
        const guild = guilds.get(dbRole.guildId);

        if (!guild) {
          await this.db.role.delete({
            where: {
              id: dbRole.id,
            },
          });
        }
      }),
    );
  }

  private async cacheGuild(guild: Guild) {
    this.cached[guild.id] = {
      channels: [],
      roles: [],
    };

    await this.db.guild.upsert({
      where: {
        id: guild.id,
      },
      update: {},
      create: {
        id: guild.id,
        createdAt: new Date(guild.createdTimestamp),
        name: guild.name,
      },
    });

    const channels = (await guild.channels.fetch()).filter((channel) => !!channel);
    const roles = (await guild.roles.fetch()).filter((role) => !!role);
    const users = (await guild.members.fetch()).filter((member) => !!member && !member.user.bot);
    const invites = await guild.invites.fetch();

    await Promise.all([
      this.cacheChannels(channels, guild),
      this.cacheRoles(roles, guild),
      this.cacheUsers(users, guild),
      this.makeInvites(invites, guild),
    ]);

    this.logger.debug(`Cached guild ${guild.name}`);
  }

  async makeInvites(invites: Collection<string, Invite>, guild: Guild) {
    const dbInvites = await this.db.invite.findMany({
      where: {
        guildId: guild.id,
      },
    });

    const newInvites = Array.from(invites.values())
      .filter((invite) => !dbInvites.some((dbInvite) => dbInvite.code === invite.code))
      .map((invite) => {
        if (!isGuildBasedChannel(invite.channel)) return;
        return {
          code: invite.code,
          channelId: invite.channel.id,
          guildId: guild.id,
          userId: invite.inviter?.id,
        };
      })
      .filter((invite) => !!invite);

    await this.db.invite.createMany({
      data: newInvites,
      skipDuplicates: true,
    });
  }

  async cacheChannels(channels: Collection<string, NonThreadGuildBasedChannel>, guild: Guild) {
    // Fetch the current channels in the database
    const dbChannels = await this.db.channel.findMany({
      where: {
        guildId: guild.id,
      },
    });

    // Update the cache with the existing channels from the database
    this.cached[guild.id].channels = dbChannels;

    // Identify new channels that are not already in the database
    const newChannels = Array.from(channels.values())
      .filter((channel) => !dbChannels.some((dbChannel) => dbChannel.id === channel.id))
      .map((channel) => {
        return {
          id: channel.id,
          name: channel.name,
          type: this.formatChannelType(channel.type),
          guildId: guild.id,
          description: 'topic' in channel ? channel.topic : '',
        };
      });

    // Insert the new channels into the database while skipping duplicates
    if (newChannels.length > 0) {
      await this.db.channel.createMany({
        data: newChannels,
        skipDuplicates: true,
      });

      // Update the cache with the newly added channels
      this.cached[guild.id].channels = [...this.cached[guild.id].channels, ...newChannels];
    }
  }

  async cacheGuilds() {
    const guilds = this.guilds.cache;
    await Promise.all(guilds.map((guild) => this.cacheGuild(guild)));
  }

  async cacheRoles(roles: Collection<string, Role>, guild: Guild) {
    const dbRoles = await this.db.role.findMany({
      where: {
        guildId: guild.id,
      },
    });

    this.cached[guild.id].roles = dbRoles;

    const newRoles = Array.from(roles.values())
      .filter((role) => !dbRoles.some((dbRole) => dbRole.id === role.id))
      .map((role) => {
        return {
          id: role.id,
          name: role.name,
          guildId: guild.id,
        };
      });

    const createdRoles = await this.db.role.createManyAndReturn({
      data: newRoles,
      skipDuplicates: true,
    });

    this.cached[guild.id].roles = [...this.cached[guild.id].roles, ...createdRoles];
  }

  async cacheUsers(users: Collection<string, GuildMember>, guild: Guild) {
    const newUsers = Array.from(users.values()).map((user) => {
      return {
        userId: user.id,
        guildId: guild.id,
      };
    });

    this.db.$transaction([
      this.db.user.createMany({
        data: newUsers.map((user) => {
          return {
            id: user.userId,
          };
        }),
        skipDuplicates: true,
      }),
      this.db.guildMember.createMany({
        data: newUsers,
        skipDuplicates: true,
      }),
    ]);
  }

  public formatChannelType(type: ChannelType): DBChannelType {
    switch (type) {
      case ChannelType.GuildText:
        return DBChannelType.TEXT;
      case ChannelType.GuildVoice:
        return DBChannelType.VOICE;
      case ChannelType.GuildCategory:
        return DBChannelType.CATEGORY;
      case ChannelType.GuildForum:
        return DBChannelType.FORUM;
      default:
        return DBChannelType.UNKNOWN;
    }
  }
}
