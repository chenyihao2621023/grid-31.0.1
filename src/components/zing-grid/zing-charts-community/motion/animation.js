import { interpolateColor, interpolateNumber } from '../interpolate';
import { Node } from '../scene/node';
import { clamp } from '../util/number';
import { linear } from './easing';
export const QUICK_TRANSITION = 0.2;
export const INITIAL_LOAD = {
  animationDuration: 1,
  animationDelay: 0
};
export const REMOVE_PHASE = {
  animationDuration: 0.25,
  animationDelay: 0
};
export const UPDATE_PHASE = {
  animationDuration: 0.5,
  animationDelay: 0.25
};
export const ADD_PHASE = {
  animationDuration: 0.25,
  animationDelay: 0.75
};
export const LABEL_PHASE = {
  animationDuration: QUICK_TRANSITION,
  animationDelay: 1
};
export var RepeatType;
(function (RepeatType) {
  RepeatType["Loop"] = "loop";
  RepeatType["Reverse"] = "reverse";
})(RepeatType || (RepeatType = {}));
function isNodeArray(array) {
  return array.every(n => n instanceof Node);
}
export function deconstructSelectionsOrNodes(selectionsOrNodes) {
  return isNodeArray(selectionsOrNodes) ? {
    nodes: selectionsOrNodes,
    selections: []
  } : {
    nodes: [],
    selections: selectionsOrNodes
  };
}
export class Animation {
  constructor(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    this.elapsed = 0;
    this.iteration = 0;
    this.isPlaying = false;
    this.isReverse = false;
    this.id = opts.id;
    this.groupId = opts.groupId;
    this.autoplay = (_a = opts.autoplay) !== null && _a !== void 0 ? _a : true;
    this.delay = (_b = opts.delay) !== null && _b !== void 0 ? _b : 0;
    this.duration = (_c = opts.duration) !== null && _c !== void 0 ? _c : 1000;
    this.ease = (_d = opts.ease) !== null && _d !== void 0 ? _d : linear;
    this.repeat = (_e = opts.repeat) !== null && _e !== void 0 ? _e : 0;
    this.repeatType = (_f = opts.repeatType) !== null && _f !== void 0 ? _f : RepeatType.Loop;
    this.onComplete = opts.onComplete;
    this.onPlay = opts.onPlay;
    this.onStop = opts.onStop;
    this.onRepeat = opts.onRepeat;
    this.onUpdate = opts.onUpdate;
    this.interpolate = this.createInterpolator(opts.from, opts.to);
    if (opts.skip === true) {
      (_g = this.onUpdate) === null || _g === void 0 ? void 0 : _g.call(this, opts.to, false, this);
      (_h = this.onStop) === null || _h === void 0 ? void 0 : _h.call(this, this);
      (_j = this.onComplete) === null || _j === void 0 ? void 0 : _j.call(this, this);
    } else if (this.autoplay) {
      this.play();
      (_k = this.onUpdate) === null || _k === void 0 ? void 0 : _k.call(this, opts.from, true, this);
    }
  }
  play() {
    var _a;
    if (!this.isPlaying) {
      this.isPlaying = true;
      (_a = this.onPlay) === null || _a === void 0 ? void 0 : _a.call(this, this);
    }
    return this;
  }
  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
    }
    return this;
  }
  stop() {
    var _a;
    if (this.isPlaying) {
      this.isPlaying = false;
      (_a = this.onStop) === null || _a === void 0 ? void 0 : _a.call(this, this);
    }
    return this;
  }
  reset(opts) {
    const deltaState = this.interpolate(this.isReverse ? 1 - this.delta : this.delta);
    this.interpolate = this.createInterpolator(deltaState, opts.to);
    this.elapsed = 0;
    this.iteration = 0;
    if (typeof opts.delay === 'number') {
      this.delay = opts.delay;
    }
    if (typeof opts.duration === 'number') {
      this.duration = opts.duration;
    }
    if (typeof opts.ease === 'function') {
      this.ease = opts.ease;
    }
    return this;
  }
  update(time) {
    var _a, _b, _c;
    this.elapsed += time;
    if (this.elapsed <= this.delay) {
      return this;
    }
    const value = this.interpolate(this.isReverse ? 1 - this.delta : this.delta);
    (_a = this.onUpdate) === null || _a === void 0 ? void 0 : _a.call(this, value, false, this);
    if (this.elapsed - this.delay >= this.duration) {
      if (this.iteration < this.repeat) {
        this.iteration++;
        this.elapsed = (this.elapsed - this.delay) % this.duration + this.delay;
        if (this.repeatType === RepeatType.Reverse) {
          this.isReverse = !this.isReverse;
        }
        (_b = this.onRepeat) === null || _b === void 0 ? void 0 : _b.call(this, this);
      } else {
        this.stop();
        (_c = this.onComplete) === null || _c === void 0 ? void 0 : _c.call(this, this);
      }
    }
    return this;
  }
  get delta() {
    return this.ease(clamp(0, (this.elapsed - this.delay) / this.duration, 1));
  }
  createInterpolator(from, to) {
    if (typeof to !== 'object') {
      return this.interpolateValue(from, to);
    }
    const interpolatorEntries = [];
    for (const key in to) {
      const interpolator = this.interpolateValue(from[key], to[key]);
      if (interpolator != null) {
        interpolatorEntries.push([key, interpolator]);
      }
    }
    return d => {
      const result = {};
      for (const [key, interpolator] of interpolatorEntries) {
        result[key] = interpolator(d);
      }
      return result;
    };
  }
  interpolateValue(a, b) {
    if (a === undefined || b === undefined) {
      return undefined;
    }
    try {
      switch (typeof a) {
        case 'number':
          return interpolateNumber(a, b);
        case 'string':
          return interpolateColor(a, b);
      }
    } catch (e) {}
    throw new Error(`Unable to interpolate values: ${a}, ${b}`);
  }
}