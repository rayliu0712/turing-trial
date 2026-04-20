import { Trial } from './trial.js';

const trial = new Trial({
  staticPlayers: [
    { model: 'xai/grok-4.20-reasoning', name: 'Grok' },
    {
      model: 'google/gemini-3-flash',
      name: 'Gemini',
    },
    {
      model: 'moonshotai/kimi-k2.5',
      name: 'Kimi',
    },
    {
      model: 'alibaba/qwen3.5-flash',
      name: 'Qwen',
    },
  ],
  doubleVote: false,
});
await trial.loop();
