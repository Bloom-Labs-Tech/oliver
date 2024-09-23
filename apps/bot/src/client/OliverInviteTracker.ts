import type { Guild, GuildMember, Invite, InviteGuild, User } from 'discord.js';
import EventEmitter from 'events';
import { OliverError } from '~/utils/errors';
import type { OliverBot } from './OliverBot';

export default class OliverInviteTracker extends EventEmitter {
  public invites: Map<string, { code: string; url: string; uses: number | null; inviter: User | null }[]> = new Map();
  public invitesVanity: Map<string, { code: string; uses: number }> = new Map();

  constructor(private client: OliverBot) {
    super();

    this.client.on('ready', () => this.ready());
    this.client.on('guildCreate', async (guild) => this.guildCreate(guild));
    this.client.on('guildDelete', async (guild) => this.guildDelete(guild));
    this.client.on('inviteCreate', async (invite) => this.inviteUpdate(invite));
    this.client.on('inviteDelete', async (invite) => this.inviteUpdate(invite));
    this.client.on('guildMemberAdd', async (member) => this.memberAdd(member));
  }

  static async getMemberInvites(member: GuildMember) {
    try {
      if (!member?.guild || !member?.user) throw new OliverError("Couldn't find the guild or the user!");
      const guildInvites = await member.guild.invites.fetch();
      const invite = guildInvites
        ?.filter((i) => i?.inviter?.id === member?.user?.id)
        ?.map((i) => {
          return {
            code: i.code,
            uses: i.uses,
          };
        });

      return {
        count: invite?.reduce((p, v) => p + (v.uses ?? 0), 0),
        codes: invite?.map((i) => i.code),
      };
    } catch (e) {
      if (e instanceof OliverError) return e;
      if (typeof e === 'string') return new Error(e);
      return new Error('An error occurred while fetching the invites');
    }
  }

  static async getTopInvites(guild: Guild) {
    if (!guild?.id) return new Error("Can't find the guild!");
    try {
      const guildInvites = await guild.invites.fetch();
      const memberInvites = [...new Set(guildInvites?.map((i) => i?.inviter?.id))];
      const top = memberInvites
        .map((inv) => {
          const invite = guildInvites
            ?.filter((i) => i?.inviter?.id === inv)
            ?.map((i) => {
              return {
                code: i.code,
                uses: i.uses,
                inviter: i.inviter,
              };
            });

          return {
            user: invite[0]?.inviter,
            count: invite?.reduce((p, v) => p + (v.uses ?? 0), 0),
            codes: invite?.map((i) => i.code),
          };
        })
        ?.sort((a, b) => b.count - a.count);
      return top;
    } catch (e) {
      if (e instanceof OliverError) return e;
      if (typeof e === 'string') return new Error(e);
      return new Error('An error occurred while fetching the invites');
    }
  }

  static async getInfo(client: OliverBot, code: string) {
    if (!client || typeof client !== 'object') return new Error("Can't get info without discord client!");
    if (!code) return new Error('Invite URL/code required');
    try {
      const invite = await client.fetchInvite(code);
      return {
        ...invite,
        url: `https://discord.gg/${invite.code}`,
      };
    } catch (e) {
      return null;
    }
  }

  async resolveInvites(guild: Guild | InviteGuild, invites: Invite[] | null) {
    try {
      if (invites) {
        const tempInvites = invites.map((i) => this.tempInvites(i));
        this.invites.set(guild.id, tempInvites);
      }

      if (guild.features.includes('VANITY_URL')) {
        const vanityData = 'fetchVanityData' in guild ? await guild.fetchVanityData() : null;
        if (vanityData?.code) {
          this.invitesVanity.set(guild.id, {
            code: vanityData.code,
            uses: vanityData.uses,
          });
        }
      }
    } catch (e) {
      this.emit('error', guild, e);
    }
  }

  tempInvites(invite: Invite) {
    return {
      code: invite.code,
      url: `https://discord.gg/${invite.code}`,
      uses: invite.uses,
      inviter: invite.inviter,
    };
  }

  async ready() {
    for (const guild of this.client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        this.resolveInvites(guild, Object.values(invites));
      } catch (e) {
        this.emit('error', guild, e);
      }
    }
  }

  async inviteUpdate(invite: Invite) {
    if (!invite.guild) return;
    try {
      const invites = 'invites' in invite.guild ? await invite.guild.invites.fetch() : null;
      if (invites) {
        this.resolveInvites(invite.guild, Object.values(invites));
      }
    } catch (e) {
      this.emit('error', invite.guild, e);
    }
  }

  async guildCreate(guild: Guild) {
    try {
      const invites = await guild.invites.fetch();
      this.resolveInvites(guild, Object.values(invites));
    } catch (e) {
      this.emit('error', guild, e);
    }
  }

  async guildDelete(guild: Guild) {
    this.invites.delete(guild.id);
  }

  async memberAdd(member: GuildMember) {
    let resData: {
      invite: { code: string; url: string; count: number; isVanity?: boolean };
      inviter?: User;
      member: GuildMember;
    } | null = null;
    try {
      if (member.user.bot) {
        const log = await member.guild.fetchAuditLogs({ type: 28 }).then((audit) => audit.entries.first());
        const user = log?.executor;
        const bot = log?.target;

        if (bot?.id === member?.user?.id) {
          resData = {
            invite: {
              code: 'Unknown',
              url: 'Unknown',
              count: 0,
            },
            inviter: user ?? undefined,
            member: member,
          };
        }
      } else {
        const guildInvites = await member.guild.invites.fetch();
        const tempInvites = this.invites.get(member.guild.id);
        let findInvite = guildInvites.find((invite) =>
          tempInvites?.find((inv) => inv.code === invite.code && (inv.uses ?? 0) < (invite.uses ?? 0)),
        );

        if (!findInvite) {
          const newInvites = guildInvites.filter((inv) => !tempInvites?.find((c) => c.code === inv.code));
          findInvite = newInvites.find((inv) => inv.uses === 1);
        }

        if (findInvite) {
          resData = {
            invite: {
              code: findInvite.code,
              url: `https://discord.gg/${findInvite.code}`,
              count: guildInvites
                .filter((i) => i?.inviter?.id === findInvite?.inviter?.id)
                .reduce((p, v) => p + (v.uses ?? 0), 0),
            },
            inviter: findInvite.inviter ?? undefined,
            member: member,
          };
        } else if (member.guild.features.includes('VANITY_URL')) {
          const owner = await member.guild.fetchOwner();
          const vanityData = await member.guild.fetchVanityData();

          if (vanityData.code) {
            this.invitesVanity.set(member.guild.id, {
              code: vanityData.code,
              uses: vanityData.uses,
            });

            resData = {
              invite: {
                code: vanityData.code,
                url: `https://discord.gg/${vanityData.code}`,
                count: vanityData.uses,
                isVanity: true,
              },
              inviter: owner.user,
              member: member,
            };
          }
        }

        this.resolveInvites(member.guild, Object.values(guildInvites));
      }

      if (!resData) {
        const owner = await member.guild.fetchOwner();
        resData = {
          invite: {
            code: 'Unknown',
            url: 'Unknown',
            count: 0,
          },
          inviter: owner.user,
          member: member,
        };
      }

      const data = await member.guild.members.fetch(resData.inviter?.id ?? '');
      this.emit('guildMemberAdd', data, resData.inviter, resData.invite);
    } catch (e) {
      this.emit('guildMemberAdd', member, null, null, e);
      this.emit('error', member.guild, e);
    }
  }
}
