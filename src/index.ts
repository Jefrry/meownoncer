import { bot } from './bot/bot.js';
import { logger } from './utils/logger.js';

async function startBot(): Promise<void> {
  await bot.launch();
  logger.info('Bot started');
}

startBot().catch((error: unknown) => {
  logger.error('Failed to start bot', error);
  process.exitCode = 1;
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
