import postgres from 'postgres';
import { env } from '$env/dynamic/private';

let client: postgres.Sql | undefined;


function getClient(): postgres.Sql {
      if (!client) {
              if (!env.DATABASE_URL) {
                      throw new Error('DATABASE_URL is required');
              }
              client = postgres(env.DATABASE_URL, { max: 10, idle_timeout: 20 });
      }
      return client;
}

export const sql = new Proxy(function () {} as unknown as postgres.Sql, {
      apply(_target, _thisArg, args) {
              return (getClient() as unknown as (...a: unknown[]) => unknown)(...args);
      },
      get(_target, prop) {
              const instance = getClient() as unknown as Record<string | symbol, unknown>;
              const value = instance[prop];
              return typeof value === 'function' ? value.bind(instance) : value;
      }
});