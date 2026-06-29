import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import {
  AWAITING_ANNOUNCEMENT_IMAGE_STATE,
  AWAITING_ANNOUNCEMENT_TEXT_STATE,
  AWAITING_DISCORD_WEBHOOK_STATE,
  AWAITING_VK_SETTINGS_STATE,
} from '../../constants.js';
import { DiscordService } from '../../modules/integrations/discord/discord.service.js';
import { IntegrationService } from '../../modules/integrations/integration.service.js';
import type { DiscordIntegrationSettings } from '../../modules/integrations/integration.types.js';
import { VkService } from '../../modules/integrations/vk/vk.service.js';
import { UserService } from '../../modules/users/user.service.js';
import { UserStateManager } from '../../modules/users/userStateManager.js';
import { decryptJson } from '../../utils/crypto.js';
import {
  announcementImageKeyboard,
  announcementPlatformsKeyboard,
  announcementTextKeyboard,
} from '../keyboards/announcement.keyboard.js';
import {
  discordIntegrationKeyboard,
  integrationsKeyboard,
  vkIntegrationKeyboard,
} from '../keyboards/integrations.keyboard.js';
import { mainKeyboard } from '../keyboards/main.keyboard.js';

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
    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    userStateManager.setAwaitingAnnouncementText(ctx.from.id);
    await ctx.editMessageText('Отправь текст анонса.', announcementTextKeyboard);
  });

  bot.action('announcement:cancel', async (ctx) => {
    await ctx.answerCbQuery();

    if (ctx.from) {
      userStateManager.clear(ctx.from.id);
    }

    await ctx.editMessageText('Создание анонса отменено.', mainKeyboard);
  });

  bot.action('announcement:skip_image', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    const state = userStateManager.get(ctx.from.id);

    if (state?.type !== AWAITING_ANNOUNCEMENT_IMAGE_STATE) {
      await ctx.reply('Не найден черновик анонса. Создай анонс заново.');
      return;
    }

    userStateManager.clear(ctx.from.id);

    const announcement = userStateManager.saveAnnouncement(ctx.from.id, {
      text: state.text,
    });

    await ctx.reply(
      announcement.text,
      announcementPlatformsKeyboard(announcement.discordStatus),
    );
  });

  bot.action('announcement:send_discord', async (ctx) => {
    await ctx.answerCbQuery();

    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    const announcement = userStateManager.getAnnouncement(ctx.from.id);

    if (!announcement) {
      await ctx.reply('Не найден анонс для отправки. Создай анонс заново.');
      return;
    }

    try {
      const user = await userService.registerTelegramUser(ctx.from);
      const discordIntegration =
        await integrationService.getDiscordIntegration(user.id);

      if (!discordIntegration) {
        const updatedAnnouncement =
          userStateManager.setDiscordAnnouncementStatus(
            ctx.from.id,
            'failed',
          );

        if (updatedAnnouncement) {
          await ctx.editMessageReplyMarkup(
            announcementPlatformsKeyboard(
              updatedAnnouncement.discordStatus,
            ).reply_markup,
          );
        }

        await ctx.reply(
          'Discord не подключён. Подключи его в разделе Мои площадки.',
        );
        return;
      }

      const { webhookUrl } = decryptJson<DiscordIntegrationSettings>(
        discordIntegration.encryptedSettings,
      );
      const imageUrl = announcement.imageTelegramFileId
        ? (await ctx.telegram.getFileLink(
            announcement.imageTelegramFileId,
          )).toString()
        : undefined;

      await discordService.sendAnnouncement({
        webhookUrl,
        text: announcement.text,
        imageUrl,
      });

      const updatedAnnouncement = userStateManager.setDiscordAnnouncementStatus(
        ctx.from.id,
        'sent',
      );

      if (updatedAnnouncement) {
        await ctx.editMessageReplyMarkup(
          announcementPlatformsKeyboard(
            updatedAnnouncement.discordStatus,
          ).reply_markup,
        );
      }

      await ctx.reply('Анонс отправлен в Discord.');
    } catch (error) {
      const updatedAnnouncement = userStateManager.setDiscordAnnouncementStatus(
        ctx.from.id,
        'failed',
      );

      if (updatedAnnouncement) {
        await ctx.editMessageReplyMarkup(
          announcementPlatformsKeyboard(
            updatedAnnouncement.discordStatus,
          ).reply_markup,
        );
      }

      const messageText =
        error instanceof Error
          ? error.message
          : 'Не удалось отправить анонс в Discord.';

      await ctx.reply(messageText);
    }
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

    if (state.type === AWAITING_DISCORD_WEBHOOK_STATE) {
      userStateManager.clear(telegramId);

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
      userStateManager.clear(telegramId);

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

      return;
    }

    if (state.type === AWAITING_ANNOUNCEMENT_TEXT_STATE) {
      const text = ctx.message.text.trim();

      if (!text) {
        await ctx.reply('Текст анонса не должен быть пустым.');
        return;
      }

      userStateManager.setAwaitingAnnouncementImage(telegramId, text);
      await ctx.reply(
        'Теперь отправь картинку анонса или продолжи без картинки.',
        announcementImageKeyboard,
      );

      return;
    }

    if (state.type === AWAITING_ANNOUNCEMENT_IMAGE_STATE) {
      await ctx.reply(
        'Отправь картинку анонса или нажми «Продолжить без картинки».',
        announcementImageKeyboard,
      );
    }
  });

  bot.hears('Создать анонс', async (ctx) => {
    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    userStateManager.setAwaitingAnnouncementText(ctx.from.id);
    await ctx.reply('Отправь текст анонса.', announcementTextKeyboard);
  });

  bot.hears('Мои площадки', async (ctx) => {
    await ctx.reply('Твои подключённые площадки:', integrationsKeyboard);
  });

  bot.on(message('photo'), async (ctx, next) => {
    const telegramId = ctx.from.id;
    const state = userStateManager.get(telegramId);

    if (state?.type !== AWAITING_ANNOUNCEMENT_IMAGE_STATE) {
      await next();
      return;
    }

    userStateManager.clear(telegramId);

    const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];
    const imageTelegramFileId = largestPhoto?.file_id;

    if (!imageTelegramFileId) {
      await ctx.reply('Не удалось получить картинку анонса. Попробуй ещё раз.');
      userStateManager.setAwaitingAnnouncementImage(telegramId, state.text);
      return;
    }

    const announcement = userStateManager.saveAnnouncement(telegramId, {
      text: state.text,
      imageTelegramFileId,
    });

    if (announcement.text.length <= 1024) {
      await ctx.replyWithPhoto(imageTelegramFileId, {
        caption: announcement.text,
        ...announcementPlatformsKeyboard(announcement.discordStatus),
      });
      return;
    }

    await ctx.replyWithPhoto(imageTelegramFileId);
    await ctx.reply(
      announcement.text,
      announcementPlatformsKeyboard(announcement.discordStatus),
    );
  });
}
