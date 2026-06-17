import { Markup } from 'telegraf';

export const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Создать анонс', 'menu:create_announcement')],
  [Markup.button.callback('Мои площадки', 'menu:integrations')],
]);
