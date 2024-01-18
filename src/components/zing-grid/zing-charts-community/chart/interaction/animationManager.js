var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Animation } from '../../motion/animation';
import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';
import { BaseManager } from './baseManager';
const DEBUG_SELECTORS = [true, 'animation'];
/**
 * Manage animations across a chart, running all animations through only one `requestAnimationFrame` callback,
 * preventing duplicate animations and handling their lifecycle.
 */
export class AnimationManager extends BaseManager {
    constructor(interactionManager, chartUpdateMutex) {
        super();
        this.interactionManager = interactionManager;
        this.chartUpdateMutex = chartUpdateMutex;
        this.defaultDuration = 1000;
        this.batch = new AnimationBatch();
        this.debug = Debug.create(...DEBUG_SELECTORS);
        this.isPlaying = false;
        this.requestId = null;
        this.skipAnimations = false;
    }
    /**
     * Create an animation to tween a value between the `from` and `to` properties. If an animation already exists
     * with the same `id`, immediately stop it.
     */
    animate(_a) {
        var _b, _c;
        var { disableInteractions = true, immutable = true } = _a, opts = __rest(_a, ["disableInteractions", "immutable"]);
        const { batch } = this;
        try {
            if (opts.id != null && batch.controllers.has(opts.id)) {
                if (!immutable) {
                    return batch.controllers.get(opts.id).reset(opts);
                }
                batch.controllers.get(opts.id).stop();
                this.debug(`Skipping animation batch due to update of existing animation: ${opts.id}`);
                this.batch.skip();
            }
        }
        catch (error) {
            this.failsafeOnError(error);
            return;
        }
        const id = (_b = opts.id) !== null && _b !== void 0 ? _b : Math.random().toString();
        const skip = this.isSkipped();
        if (skip) {
            this.debug('AnimationManager - skipping animation');
        }
        return new Animation(Object.assign(Object.assign({}, opts), { id,
            skip, autoplay: this.isPlaying ? opts.autoplay : false, duration: (_c = opts.duration) !== null && _c !== void 0 ? _c : this.defaultDuration, onPlay: (controller) => {
                var _a;
                batch.controllers.set(id, controller);
                this.requestAnimation();
                if (disableInteractions) {
                    this.interactionManager.pause('animation');
                }
                (_a = opts.onPlay) === null || _a === void 0 ? void 0 : _a.call(controller, controller);
            }, onStop: (controller) => {
                var _a;
                batch.controllers.delete(id);
                if (disableInteractions) {
                    this.interactionManager.resume('animation');
                }
                (_a = opts.onStop) === null || _a === void 0 ? void 0 : _a.call(controller, controller);
            } }));
    }
    play() {
        if (this.isPlaying) {
            return;
        }
        this.isPlaying = true;
        this.debug('AnimationManager.play()');
        for (const controller of this.batch.controllers.values()) {
            try {
                controller.play();
            }
            catch (error) {
                this.failsafeOnError(error);
            }
        }
        this.requestAnimation();
    }
    pause() {
        if (!this.isPlaying) {
            return;
        }
        this.isPlaying = false;
        this.cancelAnimation();
        this.debug('AnimationManager.pause()');
        for (const controller of this.batch.controllers.values()) {
            try {
                controller.pause();
            }
            catch (error) {
                this.failsafeOnError(error);
            }
        }
    }
    stop() {
        this.isPlaying = false;
        this.cancelAnimation();
        this.debug('AnimationManager.stop()');
        for (const controller of this.batch.controllers.values()) {
            try {
                controller.stop();
            }
            catch (error) {
                this.failsafeOnError(error, false);
            }
        }
    }
    stopByAnimationId(id) {
        var _a;
        try {
            if (id != null && this.batch.controllers.has(id)) {
                (_a = this.batch.controllers.get(id)) === null || _a === void 0 ? void 0 : _a.stop();
            }
        }
        catch (error) {
            this.failsafeOnError(error);
            return;
        }
    }
    stopByAnimationGroupId(id) {
        for (const controller of this.batch.controllers.values()) {
            if (controller.groupId === id) {
                this.stopByAnimationId(controller.id);
            }
        }
    }
    reset() {
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
        else {
            this.stop();
        }
    }
    skip(skip = true) {
        this.skipAnimations = skip;
    }
    isSkipped() {
        return this.skipAnimations || this.batch.isSkipped();
    }
    isActive() {
        return this.isPlaying && this.batch.isActive();
    }
    skipCurrentBatch() {
        if (Debug.check(...DEBUG_SELECTORS)) {
            this.debug(`AnimationManager - skipCurrentBatch()`, { stack: new Error().stack });
        }
        this.batch.skip();
    }
    /** Mocking point for tests to guarantee that animation updates happen. */
    isSkippingFrames() {
        return true;
    }
    /** Mocking point for tests to capture requestAnimationFrame callbacks. */
    scheduleAnimationFrame(cb) {
        this.requestId = requestAnimationFrame(cb);
    }
    requestAnimation() {
        if (!this.batch.isActive() || this.requestId !== null)
            return;
        let prevTime;
        const onAnimationFrame = (time) => __awaiter(this, void 0, void 0, function* () {
            const executeAnimationFrame = () => __awaiter(this, void 0, void 0, function* () {
                const deltaTime = time - (prevTime !== null && prevTime !== void 0 ? prevTime : time);
                prevTime = time;
                this.debug('AnimationManager - onAnimationFrame()', {
                    controllersCount: this.batch.controllers.size,
                });
                for (const controller of this.batch.controllers.values()) {
                    try {
                        controller.update(deltaTime);
                    }
                    catch (error) {
                        this.failsafeOnError(error);
                    }
                }
                this.listeners.dispatch('animation-frame', {
                    type: 'animation-frame',
                    deltaMs: deltaTime,
                });
            });
            if (this.isSkippingFrames()) {
                // Only run the animation frame if we can acquire the chart update mutex immediately.
                yield this.chartUpdateMutex.acquireImmediately(executeAnimationFrame);
            }
            else {
                // Wait for the next available point we can execute.
                yield this.chartUpdateMutex.acquire(executeAnimationFrame);
            }
            if (this.batch.isActive()) {
                this.scheduleAnimationFrame(onAnimationFrame);
            }
        });
        this.scheduleAnimationFrame(onAnimationFrame);
    }
    cancelAnimation() {
        if (this.requestId === null)
            return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
        this.startBatch();
    }
    failsafeOnError(error, cancelAnimation = true) {
        Logger.error('Error during animation, skipping animations', error);
        if (cancelAnimation) {
            this.cancelAnimation();
        }
    }
    startBatch(skipAnimations) {
        this.debug(`AnimationManager - startBatch() with skipAnimations=${skipAnimations}.`);
        this.reset();
        this.batch.destroy();
        this.batch = new AnimationBatch();
        if (skipAnimations === true) {
            this.batch.skip();
        }
    }
    endBatch() {
        this.debug(`AnimationManager - endBatch() with ${this.batch.controllers.size} animations; skipped: ${this.batch.isSkipped()}.`);
        if (this.batch.isSkipped() && !this.batch.isActive()) {
            this.batch.skip(false);
        }
    }
}
/**
 * A batch of animations that are synchronised together. Can be skipped independently of other batches and the main
 * animation skipping status.
 */
class AnimationBatch {
    constructor() {
        this.controllers = new Map();
        this.skipAnimations = false;
    }
    // private phase?: 'initial-load' | 'remove' | 'update' | 'add';
    isActive() {
        return this.controllers.size > 0;
    }
    skip(skip = true) {
        if (this.skipAnimations === false && skip === true) {
            for (const controller of this.controllers.values()) {
                controller.stop();
            }
            this.controllers.clear();
        }
        this.skipAnimations = skip;
    }
    isSkipped() {
        return this.skipAnimations;
    }
    destroy() { }
}
//# sourceMappingURL=animationManager.js.map