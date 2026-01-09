"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.ProgressBar = exports.Spinner = exports.ciMode = exports.noEmoji = exports.noAnimation = exports.isTTY = exports.colors = exports.EMOJIS = void 0;
exports.setUIFlags = setUIFlags;
exports.withSpinner = withSpinner;
exports.showSection = showSection;
exports.showNextSteps = showNextSteps;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const cli_progress_1 = require("cli-progress");
// Emoji constants for consistent usage
exports.EMOJIS = {
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
};
// Color utilities
exports.colors = {
    success: chalk_1.default.green,
    error: chalk_1.default.red,
    warning: chalk_1.default.yellow,
    info: chalk_1.default.blue,
    accent: chalk_1.default.cyan,
    muted: chalk_1.default.gray,
};
// Check if we're in a TTY environment
exports.isTTY = process.stdout.isTTY;
// Global flags for disabling features
exports.noAnimation = false;
exports.noEmoji = false;
exports.ciMode = false;
// Set global flags
function setUIFlags(flags) {
    exports.noAnimation = flags.noAnimation || exports.ciMode;
    exports.noEmoji = flags.noEmoji || exports.ciMode;
    exports.ciMode = flags.ci || false;
}
// Apply emoji settings to text
function applyEmoji(text, emoji) {
    if (exports.noEmoji || !emoji)
        return text;
    return `${emoji} ${text}`;
}
// Spinner wrapper with TTY detection
class Spinner {
    text;
    emoji;
    spinner = null;
    startTime = 0;
    constructor(text, emoji) {
        this.text = text;
        this.emoji = emoji;
    }
    start() {
        if (!exports.isTTY || exports.noAnimation) {
            console.log(applyEmoji(this.text, this.emoji));
            this.startTime = Date.now();
            return this;
        }
        this.spinner = (0, ora_1.default)({
            text: applyEmoji(this.text, this.emoji),
            spinner: 'dots',
        }).start();
        this.startTime = Date.now();
        return this;
    }
    update(text, emoji) {
        if (!this.spinner) {
            if (exports.isTTY && !exports.noAnimation) {
                this.spinner = (0, ora_1.default)(applyEmoji(text, emoji)).start();
            }
            else {
                console.log(applyEmoji(text, emoji));
            }
            return this;
        }
        this.spinner.text = applyEmoji(text, emoji || this.emoji);
        return this;
    }
    succeed(text) {
        const duration = this.getDuration();
        const successText = text || this.text;
        const durationInfo = duration > 1000 ? ` (${duration}ms)` : '';
        if (this.spinner) {
            this.spinner.succeed(applyEmoji(successText, exports.EMOJIS.SUCCESS) + durationInfo);
        }
        else {
            console.log(applyEmoji(successText + durationInfo, exports.EMOJIS.SUCCESS));
        }
        return this;
    }
    fail(text) {
        const failText = text || this.text;
        if (this.spinner) {
            this.spinner.fail(applyEmoji(failText, exports.EMOJIS.ERROR));
        }
        else {
            console.error(applyEmoji(failText, exports.EMOJIS.ERROR));
        }
        return this;
    }
    stop() {
        if (this.spinner) {
            this.spinner.stop();
        }
        return this;
    }
    getDuration() {
        return Date.now() - this.startTime;
    }
}
exports.Spinner = Spinner;
// Utility function to wrap async operations with spinner
async function withSpinner(text, operation, options = {}) {
    const spinner = new Spinner(text, options.emoji);
    spinner.start();
    try {
        const result = await operation();
        spinner.succeed(options.successText);
        return result;
    }
    catch (error) {
        spinner.fail(options.failText);
        throw error;
    }
}
// Progress bar utilities
class ProgressBar {
    options;
    bar = null;
    constructor(options) {
        this.options = options;
    }
    start() {
        if (!exports.isTTY || exports.noAnimation) {
            if (this.options.title) {
                console.log(this.options.title);
            }
            return this;
        }
        this.bar = new cli_progress_1.SingleBar({
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
    update(current) {
        if (this.bar) {
            this.bar.update(current);
        }
        else if (exports.isTTY && !exports.noAnimation) {
            // Fallback to simple progress if bar not initialized
            const percent = Math.round((current / this.options.total) * 100);
            process.stdout.write(`\r${this.options.title || 'Progress'}: ${percent}% (${current}/${this.options.total})`);
        }
        return this;
    }
    increment(amount = 1) {
        if (this.bar) {
            this.bar.increment(amount);
        }
        return this;
    }
    stop() {
        if (this.bar) {
            this.bar.stop();
        }
        else if (exports.isTTY && !exports.noAnimation) {
            process.stdout.write('\n');
        }
        return this;
    }
}
exports.ProgressBar = ProgressBar;
// Enhanced console methods
exports.log = {
    success: (text) => console.log(exports.colors.success(applyEmoji(text, exports.EMOJIS.SUCCESS))),
    error: (text) => console.error(exports.colors.error(applyEmoji(text, exports.EMOJIS.ERROR))),
    warning: (text) => console.warn(exports.colors.warning(applyEmoji(text, exports.EMOJIS.WARNING))),
    info: (text) => console.log(exports.colors.info(applyEmoji(text, exports.EMOJIS.INFO))),
    plain: (text) => console.log(text),
    header: (text) => console.log(exports.colors.accent(`\n${text}\n`)),
    step: (step, total, text) => {
        const stepText = `${step}/${total}`;
        console.log(exports.colors.muted(`[${stepText}]`) + ' ' + text);
    },
};
// Utility to show a section header
function showSection(title, emoji) {
    console.log('\n' + exports.colors.accent('='.repeat(50)));
    console.log(applyEmoji(title, emoji));
    console.log(exports.colors.accent('='.repeat(50)) + '\n');
}
// Utility to show next steps
function showNextSteps(steps) {
    console.log(exports.colors.accent('\nNext steps:'));
    steps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
    });
}
