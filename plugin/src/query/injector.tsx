import React from "react";
import ReactDOM from "react-dom/client";

import type GoogleTasksPlugin from "@/index";
import { parseQuery, type QueryWarning } from "@/query/parser";
import type { TaskQuery } from "@/query/schema/tasks";
import { taskQueryDefinition } from "@/query/schema/tasks";
import { PluginContext, QueryContext } from "@/ui/context";
import { QueryRoot } from "@/ui/query/QueryRoot";

export class QueryInjector {
  private readonly plugin: GoogleTasksPlugin;

  constructor(plugin: GoogleTasksPlugin) {
    this.plugin = plugin;
  }

  onNewBlock = (source: string, el: HTMLElement) => {
    try {
      const [query, warnings] = parseQuery(source, taskQueryDefinition);

      warnings.forEach((warning) => {
        console.warn("Query warning:", warning);
      });

      // Mount React component using existing QueryRoot
      this.mountReactQuery(query, el, warnings);
    } catch (error) {
      console.error("Failed to parse query:", error);
      el.innerHTML = `<div class="gtasks-error">Error parsing query: ${(error as Error).message}</div>`;
    }
  };

  private mountReactQuery(query: TaskQuery, container: HTMLElement, warnings: QueryWarning[]) {
    // Clear existing content
    container.innerHTML = "";

    // Create root div for React
    const rootDiv = document.createElement("div");
    container.appendChild(rootDiv);

    // Create React root and render QueryRoot
    const root = ReactDOM.createRoot(rootDiv);
    root.render(
      React.createElement(
        PluginContext.Provider,
        { value: this.plugin },
        React.createElement(
          QueryContext.Provider,
          { value: query },
          React.createElement(QueryRoot, {
            query,
            warnings,
          }),
        ),
      ),
    );
  }
}
