import type { Plugin } from "obsidian";
import React from "react";
import ReactDOM from "react-dom/client";

import { parseQuery } from "@/query/parser";
import type { TaskQuery } from "@/query/schema/tasks";
import { taskQueryDefinition } from "@/query/schema/tasks";
import { PluginContext, QueryContext } from "@/ui/context";
import { QueryRoot } from "@/ui/query/QueryRoot";

export class QueryInjector {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  onNewBlock = (source: string, el: HTMLElement) => {
    try {
      const [query, warnings] = parseQuery(source, taskQueryDefinition);

      // Show warnings as tooltips or notices
      warnings.forEach((warning) => {
        console.warn("Query warning:", warning);
      });

      // Mount React component using existing QueryRoot
      this.mountReactQuery(query, el);
    } catch (error) {
      console.error("Failed to parse query:", error);
      el.innerHTML = `<div class="gtasks-error">Error parsing query: ${(error as Error).message}</div>`;
    }
  };

  private mountReactQuery(query: TaskQuery, container: HTMLElement) {
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
        { value: this.plugin as any },
        React.createElement(
          QueryContext.Provider,
          { value: query },
          React.createElement(QueryRoot, {
            query,
            warnings: [],
          }),
        ),
      ),
    );
  }
}
