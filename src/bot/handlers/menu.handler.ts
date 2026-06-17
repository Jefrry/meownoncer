import { Telegraf } from 'telegraf';

import { integrationsKeyboard } from '../keyboards/integrations.keyboard.js';
import { mainKeyboard } from '../keyboards/main.keyboard.js';
import { profileKeyboard } from '../keyboards/profile.keyboard.js';

export function registerMenuHandlers(bot: Telegraf): void {
  bot.action('menu:integrations', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      'Твои подключённые площадки:',
      integrationsKeyboard,
    );
  });

  bot.action('menu:back', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Главное меню:', mainKeyboard);
  });

  bot.action('menu:create_announcement', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      'Создание анонса пока в разработке.',
      profileKeyboard,
    );
  });

  bot.action(['integrations:discord', 'integrations:vk'], async (ctx) => {
    await ctx.answerCbQuery('Площадка пока не подключена.');
  });
}
