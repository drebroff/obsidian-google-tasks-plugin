import { z } from "zod/v4";

import { aliasedSchema } from "@/query/schema/utils";

const sortingKeysSchema = z.union([
  z.literal("dateAscending"),
  z.literal("dateDescending"),
  z.literal("order"),
  z.literal("alphabeticalAscending"),
  z.literal("alphabeticalDescending"),
]);

export type SortingKey = z.infer<typeof sortingKeysSchema>;

export const sortingAliases: Record<string, z.infer<typeof sortingKeysSchema>> = {
  date: "dateAscending",
  dateAscending: "dateAscending",
  dateDescending: "dateDescending",
  order: "order",
  "my-order": "order",
  alphabetical: "alphabeticalAscending",
  alphabeticalAscending: "alphabeticalAscending",
  alphabeticalDescending: "alphabeticalDescending",
  title: "alphabeticalAscending",
};

export const sortingSchema = z.array(aliasedSchema(sortingKeysSchema, sortingAliases));
