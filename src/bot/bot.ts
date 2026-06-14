import { Telegraf } from 'telegraf';

import { env } from '../config/env.js';

export const bot = new Telegraf(env.BOT_TOKEN);

bot.start((ctx) =>
  ctx.reply('Привет! Я помогу тебе создавать и отправлять анонсы.'),
);
