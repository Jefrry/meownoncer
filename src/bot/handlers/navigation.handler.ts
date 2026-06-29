import { Telegraf } from 'telegraf';

import { integrationsKeyboard } from '../keyboards/integrations.keyboard.js';
import { mainKeyboard } from '../keyboards/main.keyboard.js';

export class NavigationHandler {
  constructor(private readonly bot: Telegraf) {}

  register(): void {
    this.bot.action('menu:integrations', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Твои подключённые площадки:',
        integrationsKeyboard,
      );
    });

    this.bot.action('menu:back', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('Главное меню:', mainKeyboard);
    });
  }
}
