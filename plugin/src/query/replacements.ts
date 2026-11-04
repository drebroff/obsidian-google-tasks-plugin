import type { MarkdownPostProcessorContext } from "obsidian";

import type { TaskQuery } from "@/query/schema/tasks";

export function applyReplacements(query: TaskQuery, ctx: MarkdownPostProcessorContext) {
  const search = query.filter?.search;
  if (!search) {
    return;
  }

  const baseFileName = ctx.sourcePath.replace(/.*\//, "").replace(/\.md$/i, "");
  query.filter.search = search.replace(/{{filename}}/g, baseFileName).replace(/[\p{Zs}]/gu, " ").trim();
}
