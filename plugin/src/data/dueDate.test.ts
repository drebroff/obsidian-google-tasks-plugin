import { describe, expect, it } from "vitest";

import { DueDate } from "@/data/dueDate";
import { today } from "@/infra/time";

const todayString = today().toString();

describe("DueDate.parse", () => {
  it("should parse a plain date as all-day", () => {
    const due = DueDate.parse({ date: "2026-11-11", isRecurring: false });

    expect(due.start.hasTime).toBe(false);
    expect(due.start.raw.getFullYear()).toBe(2026);
  });

  it("should treat a UTC-midnight timestamp as all-day", () => {
    // This is how date-only due dates are stored by Google Tasks.
    const due = DueDate.parse({ date: "2026-11-11T00:00:00.000Z", isRecurring: false });

    expect(due.start.hasTime).toBe(false);
  });

  it("should treat a UTC-midnight timestamp without millis as all-day", () => {
    const due = DueDate.parse({ date: "2026-11-11T00:00:00Z", isRecurring: false });

    expect(due.start.hasTime).toBe(false);
  });

  it("should keep the time for a non-midnight timestamp", () => {
    const due = DueDate.parse({ date: "2026-11-11T10:30:00.000Z", isRecurring: false });

    expect(due.start.hasTime).toBe(true);
  });

  it("should keep the time for a floating local-midnight timestamp", () => {
    const due = DueDate.parse({ date: "2026-11-11T00:00:00", isRecurring: false });

    expect(due.start.hasTime).toBe(true);
  });

  it("should flag a UTC-midnight due today as today", () => {
    const due = DueDate.parse({ date: `${todayString}T00:00:00.000Z`, isRecurring: false });

    expect(due.start.flag).toBe("today");
    expect(due.start.isOverdue).toBe(false);
  });

  it("should flag a UTC-midnight due tomorrow as tomorrow", () => {
    const tomorrow = today().add({ days: 1 }).toString();
    const due = DueDate.parse({ date: `${tomorrow}T00:00:00.000Z`, isRecurring: false });

    expect(due.start.flag).toBe("tomorrow");
  });
});
