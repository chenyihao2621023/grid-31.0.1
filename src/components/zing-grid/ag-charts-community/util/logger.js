/* eslint-disable no-console */
import { doOnce } from './function';
export const Logger = {
    log(...logContent) {
        console.log(...logContent);
    },
    warn(message, ...logContent) {
        console.warn(`AG Charts - ${message}`, ...logContent);
    },
    error(message, ...logContent) {
        if (typeof message === 'object') {
            console.error(`AG Charts error`, message, ...logContent);
        }
        else {
            console.error(`AG Charts - ${message}`, ...logContent);
        }
    },
    table(...logContent) {
        console.table(...logContent);
    },
    warnOnce(message, ...logContent) {
        doOnce(() => Logger.warn(message, ...logContent), `Logger.warn: ${message}`);
    },
    errorOnce(message, ...logContent) {
        doOnce(() => Logger.error(message, ...logContent), `Logger.error: ${message}`);
    },
};
//# sourceMappingURL=logger.js.map