export declare const EMOJIS: {
    readonly SUCCESS: "✅";
    readonly ERROR: "❌";
    readonly WARNING: "⚠️";
    readonly INFO: "ℹ️";
    readonly LOCK: "🔐";
    readonly PACKAGE: "📦";
    readonly FOLDER: "📁";
    readonly GEAR: "🔧";
    readonly SEARCH: "🔍";
    readonly ROCKET: "🚀";
    readonly DOWNLOAD: "📥";
    readonly PARTY: "🎉";
    readonly WRENCH: "🔧";
    readonly CHECK: "✅";
    readonly CROSS: "❌";
    readonly ARROW: "→";
};
export declare const colors: {
    success: import("chalk").ChalkInstance;
    error: import("chalk").ChalkInstance;
    warning: import("chalk").ChalkInstance;
    info: import("chalk").ChalkInstance;
    accent: import("chalk").ChalkInstance;
    muted: import("chalk").ChalkInstance;
};
export declare const isTTY: boolean;
export declare let noAnimation: boolean;
export declare let noEmoji: boolean;
export declare let ciMode: boolean;
export declare function setUIFlags(flags: {
    noAnimation?: boolean;
    noEmoji?: boolean;
    ci?: boolean;
}): void;
export declare class Spinner {
    private text;
    private emoji?;
    private spinner;
    private startTime;
    constructor(text: string, emoji?: string | undefined);
    start(): this;
    update(text: string, emoji?: string): this;
    succeed(text?: string): this;
    fail(text?: string): this;
    stop(): this;
    private getDuration;
}
export declare function withSpinner<T>(text: string, operation: () => Promise<T>, options?: {
    emoji?: string;
    successText?: string;
    failText?: string;
}): Promise<T>;
export declare class ProgressBar {
    private options;
    private bar;
    constructor(options: {
        title?: string;
        total: number;
        format?: string;
    });
    start(): this;
    update(current: number): this;
    increment(amount?: number): this;
    stop(): this;
}
export declare const log: {
    success: (text: string) => void;
    error: (text: string) => void;
    warning: (text: string) => void;
    info: (text: string) => void;
    plain: (text: string) => void;
    header: (text: string) => void;
    step: (step: number, total: number, text: string) => void;
};
export declare function showSection(title: string, emoji?: string): void;
export declare function showNextSteps(steps: string[]): void;
