import { toArray } from './array';
import { Logger } from './logger';
import { windowValue } from './window';
const LONG_TIME_PERIOD_THRESHOLD = 2000;
let timeOfLastLog = Date.now();
const logTimeGap = () => {
    const timeSinceLastLog = Date.now() - timeOfLastLog;
    if (timeSinceLastLog > LONG_TIME_PERIOD_THRESHOLD) {
        const prettyDuration = (Math.floor(timeSinceLastLog / 100) / 10).toFixed(1);
        Logger.log(`**** ${prettyDuration}s since last log message ****`);
    }
    timeOfLastLog = Date.now();
};
export const Debug = {
    create(...debugSelectors) {
        return (...logContent) => {
            if (Debug.check(...debugSelectors)) {
                if (typeof logContent[0] === 'function') {
                    logContent = toArray(logContent[0]());
                }
                logTimeGap();
                Logger.log(...logContent);
            }
        };
    },
    check(...debugSelectors) {
        if (debugSelectors.length === 0) {
            debugSelectors.push(true);
        }
        const chartDebug = toArray(windowValue('zingChartsDebug'));
        return chartDebug.some((selector) => debugSelectors.includes(selector));
    },
};
