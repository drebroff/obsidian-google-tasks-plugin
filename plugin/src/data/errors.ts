export enum QueryErrorKind {
  BadRequest = 0,
  Unauthorized = 1,
  Forbidden = 2,
  ServerError = 3,
  Unknown = 4,
}

export function mapApiError(error: unknown): QueryErrorKind {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
    return QueryErrorKind.Unauthorized;
  }
  if (message.includes("403") || message.toLowerCase().includes("forbidden")) {
    return QueryErrorKind.Forbidden;
  }
  if (message.includes("400") || message.toLowerCase().includes("bad request")) {
    return QueryErrorKind.BadRequest;
  }
  if (message.includes("500") || message.toLowerCase().includes("server error")) {
    return QueryErrorKind.ServerError;
  }

  return QueryErrorKind.Unknown;
}
