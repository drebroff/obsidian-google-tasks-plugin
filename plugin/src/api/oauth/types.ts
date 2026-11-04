export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export type GoogleUserInfo = {
  email: string;
};

export type OAuthState = {
  isAuthenticated: boolean;
  email: string | null;
  error?: string;
};

