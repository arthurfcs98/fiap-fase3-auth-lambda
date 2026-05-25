import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface DbSecret {
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
}

export interface LoadedSecrets {
  db: DbSecret;
  jwtSecret: string;
}

export class SecretsLoader {
  private readonly client: SecretsManagerClient;

  constructor(client?: SecretsManagerClient) {
    this.client = client ?? new SecretsManagerClient({});
  }

  async load(dbSecretArn: string, jwtSecretArn: string): Promise<LoadedSecrets> {
    const [dbResp, jwtResp] = await Promise.all([
      this.client.send(new GetSecretValueCommand({ SecretId: dbSecretArn })),
      this.client.send(new GetSecretValueCommand({ SecretId: jwtSecretArn })),
    ]);

    if (!dbResp.SecretString) throw new Error('DB secret has no SecretString');
    if (!jwtResp.SecretString) throw new Error('JWT secret has no SecretString');

    const db = JSON.parse(dbResp.SecretString) as DbSecret;
    return { db, jwtSecret: jwtResp.SecretString };
  }
}
