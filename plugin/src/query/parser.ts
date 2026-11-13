import { load as loadYaml } from "js-yaml";
import { z } from "zod";

import { t } from "@/i18n";
import type { QueryDefinition } from "@/query/schema/query";

type ErrorTree = string | { msg: string; children: ErrorTree[] };

export class ParsingError extends Error {
  messages: ErrorTree[];
  inner: unknown | undefined;

  constructor(msgs: ErrorTree[], inner: unknown | undefined = undefined) {
    super(msgs.map((tree) => ParsingError.formatErrorTree(tree)).join("\n"));
    this.inner = inner;
    this.messages = msgs;
  }

  public toString(): string {
    if (this.inner) {
      return `${this.message}: '${this.inner}'`;
    }

    return super.toString();
  }

  private static formatErrorTree(tree: ErrorTree, indent = ""): string {
    if (typeof tree === "string") {
      return `${indent}${tree}`;
    }
    const lines = [`${indent}${tree.msg}`];
    for (const child of tree.children) {
      lines.push(ParsingError.formatErrorTree(child, `${indent}  `));
    }
    return lines.join("\n");
  }
}

export type QueryWarning = string;

export function parseQuery<T extends z.ZodObject>(
  raw: string,
  definition: QueryDefinition<T>,
): [z.infer<T>, QueryWarning[]] {
  let obj: Record<string, unknown> | null = null;
  const warnings: QueryWarning[] = [];

  try {
    obj = tryParseAsJson(raw);
    warnings.push(t().query.warning.jsonQuery);
  } catch {
    try {
      obj = tryParseAsYaml(raw);
    } catch {
      throw new ParsingError(["Unable to parse as YAML or JSON"]);
    }
  }

  obj ??= {};

  if (isPlainObject(obj)) {
    obj = expandDottedKeys(obj);
  }

  const [query, parsingWarnings] = parseObjectZod(obj, definition);
  warnings.push(...parsingWarnings);

  return [query, warnings];
}

function tryParseAsJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new ParsingError(["Invalid JSON"], e);
  }
}

function tryParseAsYaml(raw: string): Record<string, unknown> {
  try {
    return loadYaml(raw) as Record<string, unknown>;
  } catch (e) {
    throw new ParsingError(["Invalid YAML"], e);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Expands flat dotted keys (e.g. `filter.status`) into nested objects
 * (e.g. `{ filter: { status: ... } }`).
 *
 * In YAML, `filter.status: needsAction` is a single key containing a dot,
 * not a nested object. Since query fields are documented using dot notation
 * (e.g. `filter.due`), users naturally write them as flat keys. Without this
 * expansion those keys would be silently stripped as unknown, and defaults
 * would be applied instead.
 */
function expandDottedKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const assign = (target: Record<string, unknown>, key: string, value: unknown): void => {
    const existing = target[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      target[key] = { ...existing, ...value };
      return;
    }
    target[key] = value;
  };

  for (const [key, value] of Object.entries(obj)) {
    if (!key.includes(".")) {
      assign(result, key, value);
      continue;
    }

    const parts = key.split(".");
    let cursor: Record<string, unknown> = result;
    let expandable = true;

    for (const part of parts.slice(0, -1)) {
      const existing = cursor[part];
      if (existing !== undefined && !isPlainObject(existing)) {
        expandable = false;
        break;
      }
      if (existing === undefined) {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }

    if (expandable) {
      assign(cursor, parts[parts.length - 1], value);
    } else {
      // Cannot expand (e.g. 'filter' is already a non-object value); keep as-is.
      // Schema validation / unknown-key warnings will report it.
      assign(result, key, value);
    }
  }

  return result;
}

function findUnknownKeys(obj: Record<string, unknown>, schema: z.ZodObject): string[] {
  const keys: string[] = [];

  const validKeys = schema.keyof().options;

  for (const key of Object.keys(obj)) {
    if (!validKeys.includes(key)) {
      keys.push(key);
      continue;
    }

    const value = obj[key];
    if (typeof value !== "object" || value === null) {
      continue;
    }

    const childSchema = unwrapToObject(schema.shape[key]);

    if (childSchema !== undefined) {
      const nestedKeys = findUnknownKeys(value as Record<string, unknown>, childSchema);
      keys.push(...nestedKeys.map((w) => `${key}.${w}`));
    }
  }

  return keys;
}

/**
 * Unwraps wrapper schemas (optional, default, nullable, etc.) until the
 * underlying ZodObject is found, if any.
 */
function unwrapToObject(schema: z.ZodType): z.ZodObject | undefined {
  let current: z.ZodType = schema;

  for (let depth = 0; depth < 10; depth++) {
    if (current instanceof z.ZodObject) {
      return current;
    }

    const unwrapped = (current as unknown as { unwrap?: () => z.ZodType }).unwrap?.();
    if (unwrapped === undefined) {
      return undefined;
    }
    current = unwrapped;
  }

  return undefined;
}

function parseObjectZod<T extends z.ZodObject>(
  query: Record<string, unknown>,
  definition: QueryDefinition<T>,
): [z.infer<T>, QueryWarning[]] {
  const warnings: QueryWarning[] = [];
  for (const key of findUnknownKeys(query, definition.schema)) {
    warnings.push(t().query.warning.unknownKey(key));
  }

  const out = definition.schema.safeParse(query);
  if (!out.success) {
    throw new ParsingError(formatZodError(out.error));
  }

  warnings.push(...definition.generateWarnings(out.data));
  return [out.data, warnings];
}

function formatZodError<T extends z.ZodObject>(error: z.ZodError<z.infer<T>>): ErrorTree[] {
  const tree = z.treeifyError(error);

  const errors: ErrorTree[] = [...tree.errors];
  if (tree.properties === undefined) {
    return errors;
  }

  for (const [key, child] of Object.entries(tree.properties)) {
    if (child === undefined) {
      continue;
    }

    if (child.errors.length > 0) {
      errors.push({
        msg: `Field '${key}' has the following issues:`,
        children: child.errors,
      });
    }

    if (
      "items" in child &&
      child.items !== undefined &&
      child.items !== null &&
      Array.isArray(child.items)
    ) {
      const items = child.items as Array<{ errors: string[] }>;

      const root: ErrorTree = {
        msg: `Field '${key}' elements have the following issues:`,
        children: items.flatMap((item, idx) =>
          item.errors.map((msg) => `Item '${key}[${idx}]': ${msg}`),
        ),
      };
      errors.push(root);
    }
  }

  return errors;
}
