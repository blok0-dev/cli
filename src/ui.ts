import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { SingleBar } from 'cli-progress';

// Emoji constants for consistent usage
export const EMOJIS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOCK: '🔐',
  PACKAGE: '📦',
  FOLDER: '📁',
  GEAR: '🔧',
  SEARCH: '🔍',
  ROCKET: '🚀',
  DOWNLOAD: '📥',
  PARTY: '🎉',
  WRENCH: '🔧',
  CHECK: '✅',
  CROSS: '❌',
  ARROW: '→',
} as const;

// Color utilities
export const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  accent: chalk.cyan,
  muted: chalk.gray,
};

// Check if we're in a TTY environment
export const isTTY = process.stdout.isTTY;

// Global flags for disabling features
export let noAnimation = false;
export let noEmoji = false;
export let ciMode = false;

// Set global flags
export function setUIFlags(flags: { noAnimation?: boolean; noEmoji?: boolean; ci?: boolean }) {
  noAnimation = flags.noAnimation || ciMode;
  noEmoji = flags.noEmoji || ciMode;
  ciMode = flags.ci || false;
}

// Apply emoji settings to text
function applyEmoji(text: string, emoji?: string): string {
  if (noEmoji || !emoji) return text;
  return `${emoji} ${text}`;
}

// Spinner wrapper with TTY detection
export class Spinner {
  private spinner: Ora | null = null;
  private startTime: number = 0;

  constructor(private text: string, private emoji?: string) {}

  start(): this {
    if (!isTTY || noAnimation) {
      console.log(applyEmoji(this.text, this.emoji));
      this.startTime = Date.now();
      return this;
    }

    this.spinner = ora({
      text: applyEmoji(this.text, this.emoji),
      spinner: 'dots',
    }).start();
    this.startTime = Date.now();
    return this;
  }

  update(text: string, emoji?: string): this {
    if (!this.spinner) {
      if (isTTY && !noAnimation) {
        this.spinner = ora(applyEmoji(text, emoji)).start();
      } else {
        console.log(applyEmoji(text, emoji));
      }
      return this;
    }

    this.spinner.text = applyEmoji(text, emoji || this.emoji);
    return this;
  }

  succeed(text?: string): this {
    const duration = this.getDuration();
    const successText = text || this.text;
    const durationInfo = duration > 1000 ? ` (${duration}ms)` : '';

    if (this.spinner) {
      this.spinner.succeed(applyEmoji(successText, EMOJIS.SUCCESS) + durationInfo);
    } else {
      console.log(applyEmoji(successText + durationInfo, EMOJIS.SUCCESS));
    }
    return this;
  }

  fail(text?: string): this {
    const failText = text || this.text;
    if (this.spinner) {
      this.spinner.fail(applyEmoji(failText, EMOJIS.ERROR));
    } else {
      console.error(applyEmoji(failText, EMOJIS.ERROR));
    }
    return this;
  }

  stop(): this {
    if (this.spinner) {
      this.spinner.stop();
    }
    return this;
  }

  private getDuration(): number {
    return Date.now() - this.startTime;
  }
}

// Utility function to wrap async operations with spinner
export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>,
  options: { emoji?: string; successText?: string; failText?: string } = {}
): Promise<T> {
  const spinner = new Spinner(text, options.emoji);
  spinner.start();

  try {
    const result = await operation();
    spinner.succeed(options.successText);
    return result;
  } catch (error) {
    spinner.fail(options.failText);
    throw error;
  }
}

// Progress bar utilities
export class ProgressBar {
  private bar: SingleBar | null = null;

  constructor(private options: {
    title?: string;
    total: number;
    format?: string;
  }) {}

  start(): this {
    if (!isTTY || noAnimation) {
      if (this.options.title) {
        console.log(this.options.title);
      }
      return this;
    }

    this.bar = new SingleBar({
      format: this.options.format || '{bar} {percentage}% | {value}/{total} | {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    if (this.options.title) {
      console.log(this.options.title);
    }

    this.bar.start(this.options.total, 0);
    return this;
  }

  update(current: number): this {
    if (this.bar) {
      this.bar.update(current);
    } else if (isTTY && !noAnimation) {
      // Fallback to simple progress if bar not initialized
      const percent = Math.round((current / this.options.total) * 100);
      process.stdout.write(`\r${this.options.title || 'Progress'}: ${percent}% (${current}/${this.options.total})`);
    }
    return this;
  }

  increment(amount: number = 1): this {
    if (this.bar) {
      this.bar.increment(amount);
    }
    return this;
  }

  stop(): this {
    if (this.bar) {
      this.bar.stop();
    } else if (isTTY && !noAnimation) {
      process.stdout.write('\n');
    }
    return this;
  }
}

// Enhanced console methods
export const log = {
  success: (text: string) => console.log(colors.success(applyEmoji(text, EMOJIS.SUCCESS))),
  error: (text: string) => console.error(colors.error(applyEmoji(text, EMOJIS.ERROR))),
  warning: (text: string) => console.warn(colors.warning(applyEmoji(text, EMOJIS.WARNING))),
  info: (text: string) => console.log(colors.info(applyEmoji(text, EMOJIS.INFO))),
  plain: (text: string) => console.log(text),
  header: (text: string) => console.log(colors.accent(`\n${text}\n`)),
  step: (step: number, total: number, text: string) => {
    const stepText = `${step}/${total}`;
    console.log(colors.muted(`[${stepText}]`) + ' ' + text);
  },
};

// Utility to show a section header
export function showSection(title: string, emoji?: string) {
  console.log('\n' + colors.accent('='.repeat(50)));
  console.log(applyEmoji(title, emoji));
  console.log(colors.accent('='.repeat(50)) + '\n');
}

// Utility to show next steps
export function showNextSteps(steps: string[]) {
  console.log(colors.accent('\nNext steps:'));
  steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });
}