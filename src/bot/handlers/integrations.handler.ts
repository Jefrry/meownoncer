import { Telegraf } from 'telegraf';

import {
  discordIntegrationKeyboard,
  integrationsKeyboard,
  vkIntegrationKeyboard,
} from '../keyboards/integrations.keyboard.js';
import type { BotHandlerDeps } from './types.js';

export class IntegrationHandler {
  constructor(
    private readonly bot: Telegraf,
    private readonly deps: BotHandlerDeps,
  ) {}

  register(): void {
    this.bot.action('integrations:discord', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      const user = await this.deps.userService.registerTelegramUser(ctx.from);
      const discordIntegration =
        await this.deps.integrationService.getDiscordIntegration(user.id);
      const status = discordIntegration
        ? '✅ подключена'
        : '❌ не подключена';

      await ctx.editMessageText(
        `Discord-интеграция: ${status}`,
        discordIntegrationKeyboard(Boolean(discordIntegration)),
      );
    });

    this.bot.action('discord:connect', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      this.deps.userStateManager.setAwaitingDiscordWebhook(ctx.from.id);
      await ctx.reply('Отправь Discord webhook URL.');
    });

    this.bot.action('discord:disconnect', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      const user = await this.deps.userService.registerTelegramUser(ctx.from);
      const result = await this.deps.integrationService.disconnectDiscord(
        user.id,
      );
      const messageText =
        result.count > 0
          ? 'Discord отключён'
          : 'Discord не был подключен';

      await ctx.editMessageText(messageText, integrationsKeyboard);
    });

    this.bot.action('integrations:vk', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      const user = await this.deps.userService.registerTelegramUser(ctx.from);
      const vkIntegration =
        await this.deps.integrationService.getVkIntegration(user.id);
      const status = vkIntegration ? '✅ подключена' : '❌ не подключена';

      await ctx.editMessageText(
        `VK-интеграция: ${status}`,
        vkIntegrationKeyboard(Boolean(vkIntegration)),
      );
    });

    this.bot.action('vk:connect', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      this.deps.userStateManager.setAwaitingVkSettings(ctx.from.id);
      await ctx.reply(
        [
          'Отправь данные VK в формате:',
          'groupId:accessToken',
          '',
          'Пример:',
          '123456789:vk1.a.xxxxx',
        ].join('\n'),
      );
    });

    this.bot.action('vk:disconnect', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      const user = await this.deps.userService.registerTelegramUser(ctx.from);
      const result = await this.deps.integrationService.disconnectVk(user.id);
      const messageText =
        result.count > 0 ? 'VK отключен' : 'VK не был подключен';

      await ctx.editMessageText(messageText, integrationsKeyboard);
    });

    this.bot.hears('Мои площадки', async (ctx) => {
      await ctx.reply('Твои подключённые площадки:', integrationsKeyboard);
    });
  }
}
