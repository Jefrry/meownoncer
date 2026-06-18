import { AWAITING_DISCORD_WEBHOOK_STATE } from '../../constants.js';

type UserState = {
  type: typeof AWAITING_DISCORD_WEBHOOK_STATE;
};

export class UserStateManager {
  private readonly states = new Map<number, UserState>();

  setAwaitingDiscordWebhook(telegramId: number): void {
    this.states.set(telegramId, { type: AWAITING_DISCORD_WEBHOOK_STATE });
  }

  get(telegramId: number): UserState | undefined {
    return this.states.get(telegramId);
  }

  clear(telegramId: number): void {
    this.states.delete(telegramId);
  }
}
