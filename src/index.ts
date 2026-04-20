import { argv } from 'node:process';
import { CliTrial } from './cli/trial.js';
import { TuiTrial } from './tui/trial.js';
import { config } from './config.js';

const args = argv.slice(2);
const isCli = args.some((v) => v.toLowerCase() === 'cli');

const trial = new (isCli ? CliTrial : TuiTrial)(config);
await trial.loop();
