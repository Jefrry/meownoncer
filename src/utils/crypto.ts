import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

type EncryptedJsonPayload = {
  iv: string;
  authTag: string;
  ciphertext: string;
};

function getEncryptionKey(): Buffer {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'base64');

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error('ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }

  return key;
}

function parseEncryptedPayload(encrypted: string): EncryptedJsonPayload {
  const payload: unknown = JSON.parse(encrypted);

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('iv' in payload) ||
    !('authTag' in payload) ||
    !('ciphertext' in payload)
  ) {
    throw new Error('Invalid encrypted payload');
  }

  const { iv, authTag, ciphertext } = payload;

  if (
    typeof iv !== 'string' ||
    typeof authTag !== 'string' ||
    typeof ciphertext !== 'string'
  ) {
    throw new Error('Invalid encrypted payload');
  }

  return { iv, authTag, ciphertext };
}

export function encryptJson(data: unknown): string {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  });
}

export function decryptJson<T>(encrypted: string): T {
  try {
    const payload = parseEncryptedPayload(encrypted);
    const decipher = createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(payload.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    return JSON.parse(plaintext) as T;
  } catch (error) {
    throw new Error('Failed to decrypt data', { cause: error });
  }
}
