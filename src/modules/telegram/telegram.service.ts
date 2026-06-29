import { bot } from '../../bot/bot.js';

export class TelegramService {
  async getFileUrl(fileId: string): Promise<string> {
    const fileLink = await bot.telegram.getFileLink(fileId);

    return fileLink.toString();
  }
}
