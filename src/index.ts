import { argv, loadEnvFile } from 'node:process';
import { CliTrial } from './cli/trial.js';
import { TuiTrial } from './tui/trial.js';
import { config } from './config.js';

const args = argv.slice(2);
const isTui = args.some((v) => v.toLowerCase() === 'tui');

loadEnvFile('./.env.local');
const trial = new (isTui ? TuiTrial : CliTrial)(config);
await trial.loop();
