type DiscordOAuth2AccessToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};

type DiscordOAuth2UserInfo = {
  id: string;
  username: string;
  avatar: string;
  discriminator: string; // Deprecated (default "0")
  public_flags: number;
  flags: number;
  banner: string;
  accent_color: number;
  global_name: string;
  avatar_decoration_data: unknown;
  banner_color: string;
  clan: null;
  mfa_enabled: boolean;
  locale: string;
  premium_type: number;
  email: string;
  verified: boolean;
};
