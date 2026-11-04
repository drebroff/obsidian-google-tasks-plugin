import type React from "react";

import { ModalContext, PluginContext } from "@/ui/context";
import "./styles.scss";

type OnboardingProps = {
  onTokenSubmit?: (token: string) => Promise<void>;
};

export const OnboardingModal: React.FC<OnboardingProps> = () => {
  const modal = ModalContext.use();
  const plugin = PluginContext.use();

  const openSettings = () => {
    modal.close();
    try {
      // @ts-expect-error obsidian setting API
      plugin.app.setting?.open();
      // @ts-expect-error obsidian setting API
      plugin.app.setting?.openTabById(plugin.manifest.id);
    } catch {
      // fallback
    }
  };

  return (
    <div className="onboarding-modal-root" style={{ padding: "12px" }}>
      <h3>Welcome to Google Tasks Sync!</h3>
      <p>
        To synchronize your tasks, please configure your Google Cloud OAuth credentials (Client ID
        and Client Secret) in plugin settings.
      </p>
      <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <button type="button" onClick={() => modal.close()}>
          Later
        </button>
        <button type="submit" className="mod-cta" onClick={openSettings}>
          Open Settings
        </button>
      </div>
    </div>
  );
};
