import { Markup } from 'telegraf';

export const integrationsKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Discord', 'integrations:discord')],
  [Markup.button.callback('VK', 'integrations:vk')],
  [Markup.button.callback('Назад', 'menu:back')],
]);

export function discordIntegrationKeyboard(isConnected: boolean) {
  return Markup.inlineKeyboard([
    [
      isConnected
        ? Markup.button.callback('Отключить Discord', 'discord:disconnect')
        : Markup.button.callback('Подключить Discord', 'discord:connect'),
    ],
    [Markup.button.callback('Назад', 'menu:integrations')],
  ]);
}

export function vkIntegrationKeyboard(isConnected: boolean) {
  return Markup.inlineKeyboard([
    [
      isConnected
        ? Markup.button.callback('Отключить VK', 'vk:disconnect')
        : Markup.button.callback('Подключить VK', 'vk:connect'),
    ],
    [Markup.button.callback('Назад', 'menu:integrations')],
  ]);
}
