import { GoogleOAuthClient } from "@/api/oauth/client";
import { OAuthLoopbackServer } from "@/api/oauth/server";
import { useSettingsStore } from "@/settings";

const REFRESH_MARGIN_MS = 60_000; // 1 minute buffer

export class GoogleAuthManager {
  private readonly oauthClient = new GoogleOAuthClient();
  private readonly loopbackServer = new OAuthLoopbackServer();
  private readonly saveCallback: () => Promise<void>;

  constructor(saveCallback: () => Promise<void>) {
    this.saveCallback = saveCallback;
  }

  public async getValidAccessToken(): Promise<string> {
    const settings = useSettingsStore.getState();
    const { accessToken, refreshToken, tokenExpiresAt, clientId, clientSecret } = settings;

    if (!accessToken && !refreshToken) {
      throw new Error("No Google credentials found. Please authenticate in plugin settings.");
    }

    if (accessToken && tokenExpiresAt && tokenExpiresAt > Date.now() + REFRESH_MARGIN_MS) {
      return accessToken;
    }

    if (!refreshToken) {
      throw new Error("Access token expired and no refresh token available. Please log in again.");
    }

    if (!clientId || !clientSecret) {
      throw new Error("Client ID or Client Secret is missing. Please check plugin settings.");
    }

    const tokens = await this.oauthClient.refreshAccessToken(refreshToken, clientId, clientSecret);
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    useSettingsStore.setState({
      accessToken: tokens.access_token,
      tokenExpiresAt: expiresAt,
    });
    await this.saveCallback();

    return tokens.access_token;
  }

  public async login(): Promise<string> {
    const settings = useSettingsStore.getState();
    const { clientId, clientSecret } = settings;

    if (!clientId || !clientSecret) {
      throw new Error("Please enter both Client ID and Client Secret before logging in.");
    }

    const { code, redirectUri } = await this.loopbackServer.startAndListen();

    try {
      const tokens = await this.oauthClient.exchangeCodeForTokens(
        code,
        clientId,
        clientSecret,
        redirectUri,
      );

      const expiresAt = Date.now() + tokens.expires_in * 1000;
      let email: string | null = null;

      try {
        const userInfo = await this.oauthClient.fetchUserInfo(tokens.access_token);
        email = userInfo.email;
      } catch (err) {
        console.warn("Could not fetch user email:", err);
      }

      useSettingsStore.setState({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? settings.refreshToken,
        tokenExpiresAt: expiresAt,
        userEmail: email,
      });
      await this.saveCallback();

      return email ?? "Authenticated";
    } finally {
      this.loopbackServer.stop();
    }
  }

  public async logout(): Promise<void> {
    this.loopbackServer.stop();
    useSettingsStore.setState({
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      userEmail: null,
    });
    await this.saveCallback();
  }

  public getAuthUrl(redirectUri = "http://127.0.0.1:42813"): string {
    const { clientId } = useSettingsStore.getState();
    return this.oauthClient.getAuthorizationUrl(clientId, redirectUri);
  }
}
