import { describe, expect, it } from "vitest";

import { ParsingError, parseQuery } from "@/query/parser";
import { taskQueryDefinition } from "@/query/schema/tasks";

describe("parseQuery", () => {
  describe("dot-notation keys", () => {
    it("expands flat dotted keys into nested objects", () => {
      const [query, warnings] = parseQuery(
        "filter.status: needsAction\nfilter.due: today",
        taskQueryDefinition,
      );

      expect(query.filter.status).toBe("needsAction");
      expect(query.filter.due).toBe("today");
      expect(warnings).toHaveLength(0);
    });

    it("rejects invalid enum values in dotted keys", () => {
      expect(() =>
        parseQuery("filter.status: needsAction\nfilter.due: today213", taskQueryDefinition),
      ).toThrow(ParsingError);
    });

    it("merges dotted keys with nested objects", () => {
      const [query] = parseQuery(
        "filter:\n  status: completed\nfilter.due: overdue",
        taskQueryDefinition,
      );

      expect(query.filter.status).toBe("completed");
      expect(query.filter.due).toBe("overdue");
    });

    it("keeps dotted keys unexpanded when they conflict with a non-object value", () => {
      expect(() => parseQuery("filter: today\nfilter.due: overdue", taskQueryDefinition)).toThrow(
        ParsingError,
      );
    });
  });

  describe("nested syntax", () => {
    it("parses nested YAML", () => {
      const [query] = parseQuery(
        "filter:\n  status: needsAction\n  due: today",
        taskQueryDefinition,
      );

      expect(query.filter.status).toBe("needsAction");
      expect(query.filter.due).toBe("today");
    });

    it("parses JSON queries", () => {
      const [query] = parseQuery('{"filter": {"status": "completed"}}', taskQueryDefinition);

      expect(query.filter.status).toBe("completed");
    });
  });

  describe("unknown keys", () => {
    it("warns about unknown top-level keys", () => {
      const [, warnings] = parseQuery("foo: bar", taskQueryDefinition);

      expect(warnings).toContain("Found unexpected query key 'foo'. Is this a typo?");
    });

    it("warns about unknown nested keys written in dot notation", () => {
      const [, warnings] = parseQuery("filter.staus: needsAction", taskQueryDefinition);

      expect(warnings).toContain("Found unexpected query key 'filter.staus'. Is this a typo?");
    });

    it("warns about the removed autorefresh key", () => {
      const [, warnings] = parseQuery("autorefresh: 5", taskQueryDefinition);

      expect(warnings).toContain("Found unexpected query key 'autorefresh'. Is this a typo?");
    });
  });

  describe("defaults", () => {
    it("applies defaults for an empty query", () => {
      const [query] = parseQuery("", taskQueryDefinition);

      expect(query.filter.status).toBe("needsAction");
      expect(query.filter.due).toBe("all");
      expect(query.list).toBe("all");
    });
  });

  describe("invalid input", () => {
    it("throws for input that is neither JSON nor YAML", () => {
      expect(() => parseQuery("- a\n- b", taskQueryDefinition)).toThrow(ParsingError);
    });

    it("throws for non-object YAML input", () => {
      expect(() => parseQuery("just a string", taskQueryDefinition)).toThrow(ParsingError);
    });
  });
});
