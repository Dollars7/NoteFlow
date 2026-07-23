type D1Value = null | string | number | ArrayBuffer | ArrayBufferView;

interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}
