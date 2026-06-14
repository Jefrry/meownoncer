import 'dotenv/config';

const requiredEnvironmentVariables = [
  'BOT_TOKEN',
  // 'DATABASE_URL',
  // 'ENCRYPTION_KEY',
];

type EnvironmentVariable = (typeof requiredEnvironmentVariables)[number];
type Environment = Record<EnvironmentVariable, string>;

function loadEnvironment(): Environment {
  const missingVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`,
    );
  }

  return {
    BOT_TOKEN: process.env.BOT_TOKEN as string,
    // DATABASE_URL: process.env.DATABASE_URL as string,
    // ENCRYPTION_KEY: process.env.ENCRYPTION_KEY as string,
  };
}

export const env = loadEnvironment();
