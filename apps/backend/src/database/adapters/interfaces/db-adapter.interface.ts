export interface ISqlAdapter<TClient = unknown> {
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>;
  execute: (sql: string, params?: unknown[]) => Promise<unknown>;
  getClient: () => TClient;
}
