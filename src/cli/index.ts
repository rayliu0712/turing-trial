import { Trial } from './trial.js';
import { mkdir, writeFile } from 'node:fs/promises';

const trial = new Trial({
  players: [
    { model: 'xai/grok-4.20-reasoning', name: 'grok' },
    {
      model: 'zai/glm-5.1',
      name: 'glm',
    },
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

const now = new Date();
const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
await mkdir('trials', { recursive: true });
await writeFile(`trials/turing-trial(${ts}).md`, trial.toMarkdown(), 'utf-8');
