import { UserRepository } from './user.repository.js';

type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async registerTelegramUser(telegramUser: TelegramUser) {
    const telegramId = BigInt(telegramUser.id);
    const existingUser = await this.userRepository.findByTelegramId(telegramId);

    if (existingUser) {
      return existingUser;
    }

    return this.userRepository.create({
      telegramId,
      isBot: telegramUser.is_bot,
      firstName: telegramUser.first_name ?? null,
      username: telegramUser.username ?? null,
      languageCode: telegramUser.language_code ?? null,
      isPremium: telegramUser.is_premium ?? false,
    });
  }
}
