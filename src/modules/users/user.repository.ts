import { prisma } from '../../db/prisma.js';

type CreateUserData = {
  telegramId: bigint;
  isBot: boolean;
  firstName?: string | null;
  username?: string | null;
  languageCode?: string | null;
  isPremium: boolean;
};

export class UserRepository {
  findByTelegramId(telegramId: bigint) {
    return prisma.user.findUnique({
      where: {
        telegramId,
      },
    });
  }

  create(data: CreateUserData) {
    return prisma.user.create({
      data,
    });
  }
}
