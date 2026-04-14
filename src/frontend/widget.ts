import blessed from 'blessed';
import type { State } from './state.js';
import { exit, stdout } from 'node:process';
import { cursorHide, cursorShow } from 'ansi-escapes';

export class Widget {
  constructor(private state: State) {
    this.screen.key('tab', () => {
      this.state.mode = this.state.mode === 'step' ? 'auto' : 'step';
      this.builder.modeTile();
      this.render();
    });
    this.screen.key('C-c', () => {
      exit(0);
    });

    Object.values(this.builder).forEach((fn) => fn());
    this.render();

    stdout.write(cursorHide); // should be called ONLY ONCE AFTER screen.render()
    process.on('exit', () => {
      stdout.write(cursorShow);
    });
  }

  readonly screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
  });

  readonly logger = blessed.box({
    top: 0,
    bottom: 3,
    left: 0,
    right: 0,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    parent: this.screen,
  });

  readonly roundTile = blessed.box({
    bottom: 0,
    left: 0,
    height: 1,
    width: 'shrink',
    style: { inverse: true },
    parent: this.screen,
  });

  readonly modeTile = blessed.box({
    bottom: 0,
    left: 10,
    width: 'shrink',
    tags: true,
    parent: this.screen,
  });

  private readonly builder = {
    roundTile: () => {
      this.roundTile.setContent(` Round ${this.state.roundIndex} `);
    },
    modeTile: () => {
      this.modeTile.setContent(
        this.state.mode === 'step'
          ? '{red-bg}{white-fg} STEP {/white-fg}{/red-bg}'
          : '{green-bg}{black-fg} AUTO {/black-fg}{/green-bg}',
      );
    },
  };

  render() {
    this.screen.render();
  }
}
