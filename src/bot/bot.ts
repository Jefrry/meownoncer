import { Telegraf } from 'telegraf';

import { env } from '../config/env.js';
import { UserService } from '../modules/users/user.service.js';
import { registerMenuHandlers } from './handlers/menu.handler.js';
import { mainKeyboard } from './keyboards/main.keyboard.js';

export const bot = new Telegraf(env.BOT_TOKEN);

const userService = new UserService();

bot.start(async (ctx) => {
  if (!ctx.from) {
    await ctx.reply('Не удалось получить данные пользователя.');
    return;
  }

  await userService.registerTelegramUser(ctx.from);

  await ctx.reply(
    'Привет! Я помогу тебе создавать и отправлять анонсы.',
    mainKeyboard,
  );
});

registerMenuHandlers(bot);
