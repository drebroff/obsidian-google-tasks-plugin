import { useSettingsStore } from "@/settings";

export function debug(log: string | LogMessage, ...context: unknown[]) {
  logIfEnabled("log", log, context);
}

export function debugWarn(log: string | LogMessage, ...context: unknown[]) {
  logIfEnabled("warn", log, context);
}

function logIfEnabled(level: "log" | "warn", log: string | LogMessage, context: unknown[]) {
  if (!useSettingsStore.getState().debugLogging) {
    return;
  }

  if (isComplexLog(log)) {
    console[level](log.msg);
    console[level](log.context);
  } else {
    console[level](log, ...context);
  }
}

interface LogMessage {
  msg: string;
  context: object;
}

function isComplexLog(log: string | LogMessage): log is LogMessage {
  return (log as LogMessage).msg !== undefined;
}
