import { describe, expect, it } from "vitest";

import { Repository, type RepositoryItem } from "@/data/repository";

const makeItem = (
  id: string,
  title: string,
  extra?: { isDeleted?: boolean },
): RepositoryItem<string> => ({
  id,
  title,
  isDeleted: false,
  ...extra,
});

describe("Repository", () => {
  describe("applyDiff", () => {
    it("should add new items", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta")]);

      expect(repo.byId("1")).toEqual(makeItem("1", "Alpha"));
      expect(repo.byId("2")).toEqual(makeItem("2", "Beta"));
    });

    it("should update existing items", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha")]);
      repo.applyDiff([makeItem("1", "Alpha Updated")]);

      expect(repo.byId("1")).toEqual(makeItem("1", "Alpha Updated"));
    });

    it("should delete items marked as deleted", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta")]);
      repo.applyDiff([makeItem("1", "Alpha", { isDeleted: true })]);

      expect(repo.byId("1")).toBeUndefined();
      expect(repo.byId("2")).toEqual(makeItem("2", "Beta"));
    });

    it("should handle a mix of add, update, and delete in a single call", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta")]);
      repo.applyDiff([
        makeItem("1", "Alpha", { isDeleted: true }),
        makeItem("2", "Beta Updated"),
        makeItem("3", "Gamma"),
      ]);

      expect(repo.byId("1")).toBeUndefined();
      expect(repo.byId("2")).toEqual(makeItem("2", "Beta Updated"));
      expect(repo.byId("3")).toEqual(makeItem("3", "Gamma"));
    });

    it("should not throw when deleting an item that does not exist", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha", { isDeleted: true })]);

      expect(repo.byId("1")).toBeUndefined();
      expect([...repo.iter()]).toHaveLength(0);
    });
  });

  describe("byId", () => {
    it("should return the item when it exists", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha")]);

      expect(repo.byId("1")).toEqual(makeItem("1", "Alpha"));
    });

    it("should return undefined when the item does not exist", () => {
      const repo = new Repository<string, RepositoryItem<string>>();

      expect(repo.byId("nonexistent")).toBeUndefined();
    });
  });

  describe("byTitle", () => {
    it("should return the item when it exists", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta")]);

      expect(repo.byTitle("Beta")).toEqual(makeItem("2", "Beta"));
    });

    it("should return undefined when no item matches", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha")]);

      expect(repo.byTitle("Nonexistent")).toBeUndefined();
    });

    it("should return the first match when multiple items share the same title", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Same"), makeItem("2", "Same")]);

      const found = repo.byTitle("Same");
      expect(found).toBeDefined();
      expect(found?.id).toBe("1");
    });
  });

  describe("replaceAll", () => {
    it("should replace all existing items", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta")]);
      repo.replaceAll([makeItem("3", "Gamma")]);

      expect(repo.byId("1")).toBeUndefined();
      expect(repo.byId("2")).toBeUndefined();
      expect(repo.byId("3")).toEqual(makeItem("3", "Gamma"));
    });
  });

  describe("iter", () => {
    it("should return all non-deleted items", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta")]);

      const items = [...repo.iter()];
      expect(items).toEqual([makeItem("1", "Alpha"), makeItem("2", "Beta")]);
    });
  });

  describe("iterActive", () => {
    it("should filter out deleted items", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta"), makeItem("3", "Gamma")]);
      repo.applyDiff([makeItem("2", "Beta", { isDeleted: true })]);

      const items = [...repo.iterActive()];
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.id)).toEqual(["1", "3"]);
    });

    it("should return only active items", () => {
      const repo = new Repository<string, RepositoryItem<string>>();
      repo.applyDiff([makeItem("1", "Alpha"), makeItem("2", "Beta")]);

      const items = [...repo.iterActive()];
      expect(items).toEqual([makeItem("1", "Alpha"), makeItem("2", "Beta")]);
    });
  });
});
