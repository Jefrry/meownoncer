import { Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import { message } from 'telegraf/filters';

import { AWAITING_ANNOUNCEMENT_IMAGE_STATE } from '../../constants.js';
import type { DiscordIntegrationSettings } from '../../modules/integrations/integration.types.js';
import type { AnnouncementDraft } from '../../modules/users/userStateManager.js';
import { decryptJson } from '../../utils/crypto.js';
import {
  announcementPlatformsKeyboard,
  announcementTextKeyboard,
} from '../keyboards/announcement.keyboard.js';
import { mainKeyboard } from '../keyboards/main.keyboard.js';
import type { BotHandlerDeps } from './types.js';

export class AnnouncementHandler {
  constructor(
    private readonly bot: Telegraf,
    private readonly deps: BotHandlerDeps,
  ) {}

  register(): void {
    this.bot.action('menu:create_announcement', async (ctx) => {
      await ctx.answerCbQuery();
      await this.startAnnouncement(ctx, () =>
        ctx.editMessageText('Отправь текст анонса.', announcementTextKeyboard),
      );
    });

    this.bot.action('announcement:cancel', async (ctx) => {
      await ctx.answerCbQuery();

      if (ctx.from) {
        this.deps.userStateManager.clear(ctx.from.id);
      }

      await ctx.editMessageText('Создание анонса отменено.', mainKeyboard);
    });

    this.bot.action('announcement:skip_image', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      const state = this.deps.userStateManager.get(ctx.from.id);

      if (state?.type !== AWAITING_ANNOUNCEMENT_IMAGE_STATE) {
        await ctx.reply('Не найден черновик анонса. Создай анонс заново.');
        return;
      }

      this.deps.userStateManager.clear(ctx.from.id);

      const announcement = this.deps.userStateManager.saveAnnouncement(
        ctx.from.id,
        {
          text: state.text,
        },
      );

      await ctx.reply(
        announcement.text,
        announcementPlatformsKeyboard(announcement.discordStatus),
      );
    });

    this.bot.action('announcement:send_discord', async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.from) {
        await ctx.reply('Не удалось получить данные пользователя.');
        return;
      }

      const announcement = this.deps.userStateManager.getAnnouncement(
        ctx.from.id,
      );

      if (!announcement) {
        await ctx.reply('Не найден анонс для отправки. Создай анонс заново.');
        return;
      }

      try {
        const user = await this.deps.userService.registerTelegramUser(ctx.from);
        const discordIntegration =
          await this.deps.integrationService.getDiscordIntegration(user.id);

        if (!discordIntegration) {
          const updatedAnnouncement =
            this.deps.userStateManager.setDiscordAnnouncementStatus(
              ctx.from.id,
              'failed',
            );

          await this.updateDiscordAnnouncementMarkup(ctx, updatedAnnouncement);
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

        await this.deps.discordService.sendAnnouncement({
          webhookUrl,
          text: announcement.text,
          imageUrl,
        });

        const updatedAnnouncement =
          this.deps.userStateManager.setDiscordAnnouncementStatus(
            ctx.from.id,
            'sent',
          );

        await this.updateDiscordAnnouncementMarkup(ctx, updatedAnnouncement);
        await ctx.reply('Анонс отправлен в Discord.');
      } catch (error) {
        const updatedAnnouncement =
          this.deps.userStateManager.setDiscordAnnouncementStatus(
            ctx.from.id,
            'failed',
          );

        await this.updateDiscordAnnouncementMarkup(ctx, updatedAnnouncement);

        const messageText =
          error instanceof Error
            ? error.message
            : 'Не удалось отправить анонс в Discord.';

        await ctx.reply(messageText);
      }
    });

    this.bot.hears('Создать анонс', async (ctx) => {
      await this.startAnnouncement(ctx, () =>
        ctx.reply('Отправь текст анонса.', announcementTextKeyboard),
      );
    });

    this.bot.on(message('photo'), async (ctx, next) => {
      const telegramId = ctx.from.id;
      const state = this.deps.userStateManager.get(telegramId);

      if (state?.type !== AWAITING_ANNOUNCEMENT_IMAGE_STATE) {
        await next();
        return;
      }

      this.deps.userStateManager.clear(telegramId);

      const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];
      const imageTelegramFileId = largestPhoto?.file_id;

      if (!imageTelegramFileId) {
        await ctx.reply(
          'Не удалось получить картинку анонса. Попробуй ещё раз.',
        );
        this.deps.userStateManager.setAwaitingAnnouncementImage(
          telegramId,
          state.text,
        );
        return;
      }

      const announcement = this.deps.userStateManager.saveAnnouncement(
        telegramId,
        {
          text: state.text,
          imageTelegramFileId,
        },
      );

      await this.replyWithAnnouncementPreview(
        ctx,
        imageTelegramFileId,
        announcement,
      );
    });
  }

  private async startAnnouncement(
    ctx: Context,
    sendPrompt: () => Promise<unknown>,
  ): Promise<void> {
    if (!ctx.from) {
      await ctx.reply('Не удалось получить данные пользователя.');
      return;
    }

    this.deps.userStateManager.setAwaitingAnnouncementText(ctx.from.id);
    await sendPrompt();
  }

  private async updateDiscordAnnouncementMarkup(
    ctx: Context,
    announcement: AnnouncementDraft | undefined,
  ): Promise<void> {
    if (!announcement) {
      return;
    }

    await ctx.editMessageReplyMarkup(
      announcementPlatformsKeyboard(announcement.discordStatus).reply_markup,
    );
  }

  private async replyWithAnnouncementPreview(
    ctx: Context,
    imageTelegramFileId: string,
    announcement: AnnouncementDraft,
  ): Promise<void> {
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
  }
}
