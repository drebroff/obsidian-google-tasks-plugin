import { describe, expect, it } from "vitest";

import { mapApiError, QueryErrorKind } from "@/data/errors";

// mapApiError reads the error message string for status code hints.
// Google Tasks API client throws: new Error(`Google Tasks API error (${statusCode}): ${body}`)
const makeApiError = (statusCode: number): Error => {
  return new Error(`Google Tasks API error (${statusCode}): error body`);
};

describe("mapApiError", () => {
  it("should map 400 to QueryErrorKind.BadRequest", () => {
    const error = makeApiError(400);
    expect(mapApiError(error)).toBe(QueryErrorKind.BadRequest);
  });

  it("should map 401 to QueryErrorKind.Unauthorized", () => {
    const error = makeApiError(401);
    expect(mapApiError(error)).toBe(QueryErrorKind.Unauthorized);
  });

  it("should map 403 to QueryErrorKind.Forbidden", () => {
    const error = makeApiError(403);
    expect(mapApiError(error)).toBe(QueryErrorKind.Forbidden);
  });

  it("should map 500 to QueryErrorKind.ServerError", () => {
    const error = makeApiError(500);
    expect(mapApiError(error)).toBe(QueryErrorKind.ServerError);
  });

  it("should map 502 to QueryErrorKind.Unknown (not specifically handled)", () => {
    const error = makeApiError(502);
    // 502 message doesn't contain "500" or "server error", so it maps to Unknown
    expect(mapApiError(error)).toBe(QueryErrorKind.Unknown);
  });

  it("should map generic Error to QueryErrorKind.Unknown", () => {
    expect(mapApiError(new Error("network failure"))).toBe(QueryErrorKind.Unknown);
  });
});
