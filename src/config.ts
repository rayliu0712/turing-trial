import type { TrialConfig } from './core/types.js';

export const config: TrialConfig = {
  staticPlayers: [
    { model: 'xai/grok-4.20-reasoning', name: 'Grok' },
    { model: 'google/gemini-3-flash', name: 'Gemini' },
    { model: 'moonshotai/kimi-k2.5', name: 'Kimi' },
    { model: 'alibaba/qwen3.6-plus', name: 'Qwen' },
  ],
  // doubleVote: true,
  // voteMaxRetry: 2,
};
