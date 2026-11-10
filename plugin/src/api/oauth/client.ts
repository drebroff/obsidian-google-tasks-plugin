import { ObsidianFetcher, StatusCode } from "@/api/fetcher";
import type { GoogleTokenResponse, GoogleUserInfo } from "@/api/oauth/types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
const GOOGLE_USERINFO_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

export class GoogleOAuthClient {
  private readonly fetcher = new ObsidianFetcher();

  public getAuthorizationUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: `${GOOGLE_TASKS_SCOPE} ${GOOGLE_USERINFO_SCOPE}`,
      access_type: "offline",
      prompt: "consent",
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  public async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString();

    const response = await this.fetcher.fetch({
      url: GOOGLE_TOKEN_URL,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (StatusCode.isError(response.statusCode)) {
      throw new Error(`Failed to exchange authorization code: ${response.body}`);
    }

    return JSON.parse(response.body) as GoogleTokenResponse;
  }

  public async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }).toString();

    const response = await this.fetcher.fetch({
      url: GOOGLE_TOKEN_URL,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (StatusCode.isError(response.statusCode)) {
      throw new Error(`Failed to refresh access token: ${response.body}`);
    }

    return JSON.parse(response.body) as GoogleTokenResponse;
  }

  public async fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await this.fetcher.fetch({
      url: GOOGLE_USERINFO_URL,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (StatusCode.isError(response.statusCode)) {
      throw new Error(`Failed to fetch Google user info: ${response.body}`);
    }

    return JSON.parse(response.body) as GoogleUserInfo;
  }
}
