import { Markup } from 'telegraf';

export const profileKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Назад', 'menu:back')],
]);
