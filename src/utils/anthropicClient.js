import Anthropic from '@anthropic-ai/sdk';

export const API_KEY_STORAGE = 'pm_anthropic_key';

export function getClient() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) throw new Error('NO_API_KEY');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function hasApiKey() {
  return !!localStorage.getItem(API_KEY_STORAGE);
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}
