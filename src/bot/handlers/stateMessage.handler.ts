import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import {
  AWAITING_ANNOUNCEMENT_IMAGE_STATE,
  AWAITING_ANNOUNCEMENT_TEXT_STATE,
  AWAITING_DISCORD_WEBHOOK_STATE,
  AWAITING_VK_SETTINGS_STATE,
} from '../../constants.js';
import { announcementImageKeyboard } from '../keyboards/announcement.keyboard.js';
import { integrationsKeyboard } from '../keyboards/integrations.keyboard.js';
import type { BotHandlerDeps } from './types.js';

type VkSettings = {
  groupId: string;
  accessToken: string;
};

export class StateMessageHandler {
  constructor(
    private readonly bot: Telegraf,
    private readonly deps: BotHandlerDeps,
  ) {}

  register(): void {
    this.bot.on(message('text'), async (ctx, next) => {
      const telegramId = ctx.from.id;
      const state = this.deps.userStateManager.get(telegramId);

      if (!state) {
        await next();
        return;
      }

      if (state.type === AWAITING_DISCORD_WEBHOOK_STATE) {
        this.deps.userStateManager.clear(telegramId);

        if (!this.deps.discordService.validateWebhookUrl(ctx.message.text)) {
          await ctx.reply(
            'Некорректный Discord webhook URL. Нужна ссылка вида https://discord.com/api/webhooks/...',
          );
          return;
        }

        try {
          const user = await this.deps.userService.registerTelegramUser(
            ctx.from,
          );

          await this.deps.discordService.sendTestMessage(ctx.message.text);
          await this.deps.integrationService.connectDiscord(
            user.id,
            ctx.message.text,
          );
          await ctx.reply('Discord подключён', integrationsKeyboard);
        } catch (error) {
          await ctx.reply(
            this.getErrorMessage(
              error,
              'Не удалось подключить Discord webhook. Попробуй другой URL.',
            ),
          );
        }

        return;
      }

      if (state.type === AWAITING_VK_SETTINGS_STATE) {
        this.deps.userStateManager.clear(telegramId);

        const vkSettings = this.parseVkSettings(ctx.message.text);

        if (!vkSettings) {
          await ctx.reply(
            'Некорректные данные VK. Отправь их в формате groupId:accessToken.',
          );
          return;
        }

        try {
          const user = await this.deps.userService.registerTelegramUser(
            ctx.from,
          );

          await this.deps.vkService.testConnection(vkSettings);
          await this.deps.integrationService.connectVk(user.id, vkSettings);
          await ctx.reply('VK подключён', integrationsKeyboard);
        } catch (error) {
          await ctx.reply(
            this.getErrorMessage(
              error,
              'Не удалось подключить VK. Проверь groupId, токен и права доступа.',
            ),
          );
        }

        return;
      }

      if (state.type === AWAITING_ANNOUNCEMENT_TEXT_STATE) {
        const text = ctx.message.text.trim();

        if (!text) {
          await ctx.reply('Текст анонса не должен быть пустым.');
          return;
        }

        this.deps.userStateManager.setAwaitingAnnouncementImage(
          telegramId,
          text,
        );
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
  }

  private parseVkSettings(text: string): VkSettings | undefined {
    const separatorIndex = text.indexOf(':');
    const groupId =
      separatorIndex >= 0 ? text.slice(0, separatorIndex).trim() : '';
    const accessToken =
      separatorIndex >= 0 ? text.slice(separatorIndex + 1).trim() : '';

    if (!groupId || !accessToken) {
      return undefined;
    }

    return { groupId, accessToken };
  }

  private getErrorMessage(error: unknown, fallbackText: string): string {
    return error instanceof Error ? error.message : fallbackText;
  }
}
