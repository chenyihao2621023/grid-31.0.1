var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger } from '../util/logger';
import { format } from '../util/numberFormat';
import generateTicks, { createNumericTicks, range } from '../util/ticks';
import { ContinuousScale } from './continuousScale';
import { Invalidating } from './invalidating';
const identity = x => x;
export class LogScale extends ContinuousScale {
  constructor() {
    super([1, 10], [0, 1]);
    this.type = 'log';
    this.base = 10;
    this.baseLog = identity;
    this.basePow = identity;
    this.log = x => {
      const start = Math.min(this.domain[0], this.domain[1]);
      return start >= 0 ? this.baseLog(x) : -this.baseLog(-x);
    };
    this.pow = x => {
      const start = Math.min(this.domain[0], this.domain[1]);
      return start >= 0 ? this.basePow(x) : -this.basePow(-x);
    };
    this.defaultClampMode = 'clamped';
  }
  toDomain(d) {
    return d;
  }
  transform(x) {
    const start = Math.min(this.domain[0], this.domain[1]);
    return start >= 0 ? Math.log(x) : -Math.log(-x);
  }
  transformInvert(x) {
    const start = Math.min(this.domain[0], this.domain[1]);
    return start >= 0 ? Math.exp(x) : -Math.exp(-x);
  }
  refresh() {
    if (this.base <= 0) {
      this.base = 0;
      Logger.warnOnce('expecting a finite Number greater than to 0');
    }
    super.refresh();
  }
  update() {
    if (!this.domain || this.domain.length < 2) {
      return;
    }
    this.updateLogFn();
    this.updatePowFn();
    if (this.nice) {
      this.updateNiceDomain();
    }
  }
  updateLogFn() {
    const {
      base
    } = this;
    let log;
    if (base === 10) {
      log = Math.log10;
    } else if (base === Math.E) {
      log = Math.log;
    } else if (base === 2) {
      log = Math.log2;
    } else {
      const logBase = Math.log(base);
      log = x => Math.log(x) / logBase;
    }
    this.baseLog = log;
  }
  updatePowFn() {
    const {
      base
    } = this;
    let pow;
    if (base === 10) {
      pow = LogScale.pow10;
    } else if (base === Math.E) {
      pow = Math.exp;
    } else {
      pow = x => Math.pow(base, x);
    }
    this.basePow = pow;
  }
  updateNiceDomain() {
    const [d0, d1] = this.domain;
    const roundStart = d0 > d1 ? Math.ceil : Math.floor;
    const roundStop = d1 < d0 ? Math.floor : Math.ceil;
    const n0 = this.pow(roundStart(this.log(d0)));
    const n1 = this.pow(roundStop(this.log(d1)));
    this.niceDomain = [n0, n1];
  }
  static pow10(x) {
    return x >= 0 ? Math.pow(10, x) : 1 / Math.pow(10, -x);
  }
  ticks() {
    var _a;
    const count = (_a = this.tickCount) !== null && _a !== void 0 ? _a : 10;
    if (!this.domain || this.domain.length < 2 || count < 1) {
      return [];
    }
    this.refresh();
    const base = this.base;
    const [d0, d1] = this.getDomain();
    const start = Math.min(d0, d1);
    const stop = Math.max(d0, d1);
    let p0 = this.log(start);
    let p1 = this.log(stop);
    if (this.interval) {
      const step = Math.abs(this.interval);
      const absDiff = Math.abs(p1 - p0);
      let ticks = range(p0, p1, Math.min(absDiff, step));
      ticks = createNumericTicks(ticks.fractionDigits, ticks.map(x => this.pow(x)).filter(t => t >= start && t <= stop));
      if (!this.isDenseInterval({
        start,
        stop,
        interval: step,
        count: ticks.length
      })) {
        return ticks;
      }
    }
    const isBaseInteger = base % 1 === 0;
    const isDiffLarge = p1 - p0 >= count;
    if (!isBaseInteger || isDiffLarge) {
      let ticks = generateTicks(p0, p1, Math.min(p1 - p0, count));
      ticks = createNumericTicks(ticks.fractionDigits, ticks.map(x => this.pow(x)));
      return ticks;
    }
    const ticks = [];
    const isPositive = start > 0;
    p0 = Math.floor(p0) - 1;
    p1 = Math.round(p1) + 1;
    const min = Math.min(...this.range);
    const max = Math.max(...this.range);
    const availableSpacing = (max - min) / count;
    let lastTickPosition = Infinity;
    for (let p = p0; p <= p1; p++) {
      const nextMagnitudeTickPosition = this.convert(this.pow(p + 1));
      for (let k = 1; k < base; k++) {
        const q = isPositive ? k : base - k + 1;
        const t = this.pow(p) * q;
        const tickPosition = this.convert(t);
        const prevSpacing = Math.abs(lastTickPosition - tickPosition);
        const nextSpacing = Math.abs(tickPosition - nextMagnitudeTickPosition);
        const fits = prevSpacing >= availableSpacing && nextSpacing >= availableSpacing;
        if (t >= start && t <= stop && (k === 1 || fits)) {
          ticks.push(t);
          lastTickPosition = tickPosition;
        }
      }
    }
    return ticks;
  }
  tickFormat({
    count,
    ticks,
    specifier
  }) {
    const {
      base
    } = this;
    if (specifier == null) {
      specifier = base === 10 ? '.0e' : ',';
    }
    if (typeof specifier === 'string') {
      specifier = format(specifier);
    }
    if (count === Infinity) {
      return specifier;
    }
    if (ticks == null) {
      this.ticks();
    }
    return d => {
      return specifier(d);
    };
  }
}
__decorate([Invalidating], LogScale.prototype, "base", void 0);