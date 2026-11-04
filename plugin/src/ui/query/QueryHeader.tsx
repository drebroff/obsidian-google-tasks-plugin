import classNames from "classnames";
import type React from "react";
import { useRef } from "react";
import { Button } from "react-aria-components";

import { type CommandId, fireCommand } from "@/commands";
import { t } from "@/i18n";
import { type Settings, useSettingsStore } from "@/settings";
import { ObsidianIcon } from "@/ui/components/obsidian-icon";
import { MarkdownEditButtonContext, PluginContext } from "@/ui/context";

const getAddTaskCommandId = (_settings: Settings): CommandId => {
  return "add-task";
};

type Props = {
  title: string;
  isFetching: boolean;
  refresh: () => Promise<void>;
  refreshedTimestamp: Date | undefined;
};

export const QueryHeader: React.FC<Props> = ({
  title,
  isFetching,
  refresh,
  refreshedTimestamp,
}) => {
  const plugin = PluginContext.use();
  let editBlock = () => {};
  try {
    editBlock = MarkdownEditButtonContext.use()().click;
  } catch {
    // context not provided; disable edit button
  }

  const settings = useSettingsStore();
  const i18n = t().query.header;

  const refreshedAtDisplay =
    refreshedTimestamp !== undefined
      ? i18n.lastRefreshed(refreshedTimestamp.toLocaleString())
      : i18n.notRefreshed;

  return (
    <div className="todoist-query-header">
      <span className="todoist-query-title">{title}</span>
      <div className="todoist-query-controls">
        <HeaderButton
          className="add-task"
          iconId="plus"
          action={() => fireCommand(getAddTaskCommandId(settings), plugin)}
        />
        <HeaderButton
          className={classNames("refresh-query", {
            "is-refreshing": isFetching,
          })}
          iconId="refresh-ccw"
          action={async () => {
            await refresh();
          }}
          tooltip={refreshedAtDisplay ? i18n.header.refreshTooltip.lastRefreshed(new Date(refreshedTimestamp).toLocaleString()) : i18n.header.refreshTooltip.notRefreshed}
        />
        <HeaderButton
          className="edit-query"
          iconId="lucide-code-2"
          action={() => {
            editBlock();
          }}
        />
      </div>
    </div>
  );
};

type ButtonProps = {
  iconId: string;
  action: () => Promise<void> | void;
  className: string;
  tooltip?: string;
};

const HeaderButton: React.FC<ButtonProps> = ({ iconId, action, className, tooltip }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handler = async () => {
    const result = action();

    if (result instanceof Promise) {
      await result;
    }
  };

  return (
    <Button
      className={classNames("todoist-query-control-button", className)}
      onPress={handler}
      ref={buttonRef}
    >
      <ObsidianIcon id={iconId} size="s" />
    </Button>
  );
};
