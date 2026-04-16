import { Trial } from './trial.js';

const trial = new Trial({
  players: [
    { model: 'xai/grok-4.20-reasoning', name: 'grok' },
    // {
    //   model: 'zai/glm-5.1',
    //   name: 'glm',
    // },
    {
      model: 'google/gemini-3-flash',
      name: 'gemini',
    },
    {
      model: 'moonshotai/kimi-k2.5',
      name: 'kimi',
    },
    {
      model: 'alibaba/qwen3.5-flash',
      name: 'qwen',
    },
  ],
  doubleVote: true,
});
await trial.loop();
await trial.exportAsJson();
