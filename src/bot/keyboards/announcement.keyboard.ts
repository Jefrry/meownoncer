import { Markup } from 'telegraf';

import type { AnnouncementPlatformStatus } from '../../modules/users/userStateManager.js';

const DISCORD_SEND_ACTION = 'announcement:send_discord';
const CANCEL_ANNOUNCEMENT_ACTION = 'announcement:cancel';

function getDiscordButtonText(status: AnnouncementPlatformStatus): string {
  if (status === 'sent') {
    return '✅ Discord';
  }

  if (status === 'failed') {
    return '❌ Discord';
  }

  return 'Discord';
}

export const announcementTextKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Отмена', CANCEL_ANNOUNCEMENT_ACTION)],
]);

export const announcementImageKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Продолжить без картинки', 'announcement:skip_image')],
  [Markup.button.callback('Отмена', CANCEL_ANNOUNCEMENT_ACTION)],
]);

export function announcementPlatformsKeyboard(
  discordStatus: AnnouncementPlatformStatus,
) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        getDiscordButtonText(discordStatus),
        DISCORD_SEND_ACTION,
      ),
    ],
    [Markup.button.callback('Назад', 'menu:back')],
  ]);
}
