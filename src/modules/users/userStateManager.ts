import {
  AWAITING_ANNOUNCEMENT_IMAGE_STATE,
  AWAITING_ANNOUNCEMENT_TEXT_STATE,
  AWAITING_DISCORD_WEBHOOK_STATE,
  AWAITING_VK_SETTINGS_STATE,
} from '../../constants.js';

export type AnnouncementPlatformStatus = 'idle' | 'sent' | 'failed';

export type AnnouncementDraft = {
  text: string;
  imageTelegramFileId?: string;
  discordStatus: AnnouncementPlatformStatus;
};

type UserState =
  | {
      type: typeof AWAITING_DISCORD_WEBHOOK_STATE;
    }
  | {
      type: typeof AWAITING_VK_SETTINGS_STATE;
    }
  | {
      type: typeof AWAITING_ANNOUNCEMENT_TEXT_STATE;
    }
  | {
      type: typeof AWAITING_ANNOUNCEMENT_IMAGE_STATE;
      text: string;
    };

export class UserStateManager {
  private readonly states = new Map<number, UserState>();
  private readonly announcements = new Map<number, AnnouncementDraft>();

  setAwaitingDiscordWebhook(telegramId: number): void {
    this.states.set(telegramId, { type: AWAITING_DISCORD_WEBHOOK_STATE });
  }

  setAwaitingVkSettings(telegramId: number): void {
    this.states.set(telegramId, { type: AWAITING_VK_SETTINGS_STATE });
  }

  setAwaitingAnnouncementText(telegramId: number): void {
    this.states.set(telegramId, { type: AWAITING_ANNOUNCEMENT_TEXT_STATE });
  }

  setAwaitingAnnouncementImage(telegramId: number, text: string): void {
    this.states.set(telegramId, {
      type: AWAITING_ANNOUNCEMENT_IMAGE_STATE,
      text,
    });
  }

  get(telegramId: number): UserState | undefined {
    return this.states.get(telegramId);
  }

  saveAnnouncement(
    telegramId: number,
    announcement: Omit<AnnouncementDraft, 'discordStatus'>,
  ): AnnouncementDraft {
    const draft = {
      ...announcement,
      discordStatus: 'idle' as const,
    };

    this.announcements.set(telegramId, draft);

    return draft;
  }

  getAnnouncement(telegramId: number): AnnouncementDraft | undefined {
    return this.announcements.get(telegramId);
  }

  setDiscordAnnouncementStatus(
    telegramId: number,
    status: AnnouncementPlatformStatus,
  ): AnnouncementDraft | undefined {
    const announcement = this.announcements.get(telegramId);

    if (!announcement) {
      return undefined;
    }

    const updatedAnnouncement = {
      ...announcement,
      discordStatus: status,
    };

    this.announcements.set(telegramId, updatedAnnouncement);

    return updatedAnnouncement;
  }

  clear(telegramId: number): void {
    this.states.delete(telegramId);
  }
}
