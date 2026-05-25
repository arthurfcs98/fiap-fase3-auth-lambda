import { Pool, type PoolClient } from 'pg';
import type { DbSecret } from './secrets-loader';

export interface Customer {
  id: string;
  name: string;
}

export interface CustomerRepository {
  findByCpf(cpf: string): Promise<Customer | null>;
}

export class CustomerRepo implements CustomerRepository {
  private readonly pool: Pool;

  constructor(db: DbSecret, poolOverride?: Pool) {
    this.pool =
      poolOverride ??
      new Pool({
        host: db.host,
        port: db.port,
        user: db.username,
        password: db.password,
        database: db.dbname,
        max: 1,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      });
  }

  /**
   * Busca cliente pelo CPF. O schema (herdado da Fase 2) usa a coluna
   * `document` para armazenar CPF/CNPJ, com a discriminação em `document_type`.
   */
  async findByCpf(cpf: string): Promise<Customer | null> {
    const client: PoolClient = await this.pool.connect();
    try {
      const { rows } = await client.query<Customer>(
        "SELECT id::text AS id, name FROM customers WHERE document = $1 AND document_type = 'CPF' LIMIT 1",
        [cpf],
      );
      return rows[0] ?? null;
    } finally {
      client.release();
    }
  }
}
