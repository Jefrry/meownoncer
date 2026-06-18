import {
  AWAITING_DISCORD_WEBHOOK_STATE,
  AWAITING_VK_SETTINGS_STATE,
} from '../../constants.js';

type UserState =
  | {
      type: typeof AWAITING_DISCORD_WEBHOOK_STATE;
    }
  | {
      type: typeof AWAITING_VK_SETTINGS_STATE;
    };

export class UserStateManager {
  private readonly states = new Map<number, UserState>();

  setAwaitingDiscordWebhook(telegramId: number): void {
    this.states.set(telegramId, { type: AWAITING_DISCORD_WEBHOOK_STATE });
  }

  setAwaitingVkSettings(telegramId: number): void {
    this.states.set(telegramId, { type: AWAITING_VK_SETTINGS_STATE });
  }

  get(telegramId: number): UserState | undefined {
    return this.states.get(telegramId);
  }

  clear(telegramId: number): void {
    this.states.delete(telegramId);
  }
}
