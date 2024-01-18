var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Wrap a function in debouncing trigger function. A requestAnimationFrame() is scheduled
 * after the first schedule() call, and subsequent schedule() calls will be ignored until the
 * animation callback executes.
 */
export function debouncedAnimationFrame(cb) {
    return buildScheduler((cb, _delayMs) => requestAnimationFrame(cb), cb);
}
export function debouncedCallback(cb) {
    return buildScheduler((cb, delayMs = 0) => setTimeout(cb, delayMs), cb);
}
function buildScheduler(scheduleFn, cb) {
    let scheduleCount = 0;
    let promiseRunning = false;
    let awaitingPromise;
    let awaitingDone;
    const busy = () => {
        return promiseRunning;
    };
    const done = () => {
        promiseRunning = false;
        awaitingDone === null || awaitingDone === void 0 ? void 0 : awaitingDone();
        awaitingDone = undefined;
        awaitingPromise = undefined;
        if (scheduleCount > 0) {
            scheduleFn(scheduleCb);
        }
    };
    const scheduleCb = () => {
        const count = scheduleCount;
        scheduleCount = 0;
        promiseRunning = true;
        const maybePromise = cb({ count });
        if (!maybePromise) {
            done();
            return;
        }
        maybePromise.then(done).catch(done);
    };
    return {
        schedule(delayMs) {
            if (scheduleCount === 0 && !busy()) {
                scheduleFn(scheduleCb, delayMs);
            }
            scheduleCount++;
        },
        await() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!busy()) {
                    return;
                }
                if (awaitingPromise == null) {
                    awaitingPromise = new Promise((resolve) => {
                        awaitingDone = resolve;
                    });
                }
                while (busy()) {
                    yield awaitingPromise;
                }
            });
        },
    };
}
//# sourceMappingURL=render.js.map