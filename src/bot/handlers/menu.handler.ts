import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import {
  AWAITING_DISCORD_WEBHOOK_STATE,
  AWAITING_VK_SETTINGS_STATE,
} from '../../constants.js';
import { DiscordService } from '../../modules/integrations/discord/discord.service.js';
import { IntegrationService } from '../../modules/integrations/integration.service.js';
import { VkService } from '../../modules/integrations/vk/vk.service.js';
import { UserService } from '../../modules/users/user.service.js';
import { UserStateManager } from '../../modules/users/userStateManager.js';
import {
  discordIntegrationKeyboard,
  integrationsKeyboard,
  vkIntegrationKeyboard,
} from '../keyboards/integrations.keyboard.js';
import { mainKeyboard } from '../keyboards/main.keyboard.js';
import { profileKeyboard } from '../keyboards/profile.keyboard.js';

export function registerMenuHandlers(bot: Telegraf): void {
  const userService = new UserService();
  const integrationService = new IntegrationService();
  const discordService = new DiscordService();
  const vkService = new VkService();
  const userStateManager = new UserStateManager();

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

  bot.action('integrations:discord', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    const user = await userService.registerTelegramUser(ctx.from);
    const discordIntegration =
      await integrationService.getDiscordIntegration(user.id);
    const status = discordIntegration
      ? '✅ подключена'
      : '❌ не подключена';

    await ctx.editMessageText(
      `Discord-интеграция: ${status}`,
      discordIntegrationKeyboard(Boolean(discordIntegration)),
    );
  });

  bot.action('discord:connect', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    userStateManager.setAwaitingDiscordWebhook(ctx.from.id);
    await ctx.reply('Отправь Discord webhook URL.');
  });

  bot.action('discord:disconnect', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    const user = await userService.registerTelegramUser(ctx.from);
    const result = await integrationService.disconnectDiscord(user.id);
    const messageText =
      result.count > 0
        ? 'Discord отключён'
        : 'Discord не был подключен';

    await ctx.editMessageText(messageText, integrationsKeyboard);
  });

  bot.action('integrations:vk', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    const user = await userService.registerTelegramUser(ctx.from);
    const vkIntegration = await integrationService.getVkIntegration(user.id);
    const status = vkIntegration ? '✅ подключена' : '❌ не подключена';

    await ctx.editMessageText(
      `VK-интеграция: ${status}`,
      vkIntegrationKeyboard(Boolean(vkIntegration)),
    );
  });

  bot.action('vk:connect', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    userStateManager.setAwaitingVkSettings(ctx.from.id);
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

  bot.action('vk:disconnect', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    const user = await userService.registerTelegramUser(ctx.from);
    const result = await integrationService.disconnectVk(user.id);
    const messageText =
      result.count > 0 ? 'VK отключен' : 'VK не был подключен';

    await ctx.editMessageText(messageText, integrationsKeyboard);
  });

  bot.on(message('text'), async (ctx, next) => {
    const telegramId = ctx.from.id;
    const state = userStateManager.get(telegramId);

    if (!state) {
      await next();
      return;
    }

    userStateManager.clear(telegramId);

    if (state.type === AWAITING_DISCORD_WEBHOOK_STATE) {
      if (!discordService.validateWebhookUrl(ctx.message.text)) {
        await ctx.reply(
          'Некорректный Discord webhook URL. Нужна ссылка вида https://discord.com/api/webhooks/...',
        );
        return;
      }

      try {
        const user = await userService.registerTelegramUser(ctx.from);

        await discordService.sendTestMessage(ctx.message.text);
        await integrationService.connectDiscord(user.id, ctx.message.text);
        await ctx.reply('Discord подключён', integrationsKeyboard);
      } catch (error) {
        const messageText =
          error instanceof Error
            ? error.message
            : 'Не удалось подключить Discord webhook. Попробуй другой URL.';

        await ctx.reply(messageText);
      }

      return;
    }

    if (state.type === AWAITING_VK_SETTINGS_STATE) {
      const separatorIndex = ctx.message.text.indexOf(':');
      const groupId =
        separatorIndex >= 0
          ? ctx.message.text.slice(0, separatorIndex).trim()
          : '';
      const accessToken =
        separatorIndex >= 0
          ? ctx.message.text.slice(separatorIndex + 1).trim()
          : '';

      if (!groupId || !accessToken) {
        await ctx.reply(
          'Некорректные данные VK. Отправь их в формате groupId:accessToken.',
        );
        return;
      }

      try {
        const user = await userService.registerTelegramUser(ctx.from);

        await vkService.testConnection({ groupId, accessToken });
        await integrationService.connectVk(user.id, { groupId, accessToken });
        await ctx.reply('VK подключён', integrationsKeyboard);
      } catch (error) {
        const messageText =
          error instanceof Error
            ? error.message
            : 'Не удалось подключить VK. Проверь groupId, токен и права доступа.';

        await ctx.reply(messageText);
      }
    }
  });
}
