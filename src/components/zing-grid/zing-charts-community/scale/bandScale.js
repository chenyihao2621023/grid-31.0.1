var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger } from '../util/logger';
import { Invalidating } from './invalidating';
function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}
export class BandScale {
  constructor() {
    this.type = 'band';
    this.invalid = true;
    this.interval = 1;
    this.index = new Map();
    this.ordinalRange = [];
    this._domain = [];
    this.range = [0, 1];
    this._bandwidth = 1;
    this._step = 1;
    this._rawBandwidth = 1;
    this._paddingInner = 0;
    this._paddingOuter = 0;
    this.round = false;
  }
  refresh() {
    if (!this.invalid) return;
    this.invalid = false;
    this.update();
    if (this.invalid) {
      Logger.warnOnce('Expected update to not invalidate scale');
    }
  }
  set domain(values) {
    this.invalid = true;
    const domain = [];
    this.index = new Map();
    const index = this.index;
    values.forEach(value => {
      if (index.get(value) === undefined) {
        index.set(value, domain.push(value) - 1);
      }
    });
    this._domain = domain;
  }
  get domain() {
    return this._domain;
  }
  ticks() {
    this.refresh();
    const {
      interval = 1
    } = this;
    const step = Math.abs(Math.round(interval));
    return this._domain.filter((_, i) => i % step === 0);
  }
  convert(d) {
    this.refresh();
    const i = this.index.get(d);
    if (i === undefined) {
      return NaN;
    }
    const r = this.ordinalRange[i];
    if (r === undefined) {
      return NaN;
    }
    return r;
  }
  invert(position) {
    this.refresh();
    const index = this.ordinalRange.findIndex(p => p === position);
    return this.domain[index];
  }
  get bandwidth() {
    this.refresh();
    return this._bandwidth;
  }
  get step() {
    this.refresh();
    return this._step;
  }
  get rawBandwidth() {
    this.refresh();
    return this._rawBandwidth;
  }
  set padding(value) {
    value = clamp(value, 0, 1);
    this._paddingInner = value;
    this._paddingOuter = value;
  }
  get padding() {
    return this._paddingInner;
  }
  set paddingInner(value) {
    this._paddingInner = clamp(value, 0, 1);
  }
  get paddingInner() {
    return this._paddingInner;
  }
  set paddingOuter(value) {
    this._paddingOuter = clamp(value, 0, 1);
  }
  get paddingOuter() {
    return this._paddingOuter;
  }
  update() {
    const count = this._domain.length;
    if (count === 0) {
      return;
    }
    const round = this.round;
    const paddingInner = this._paddingInner;
    const paddingOuter = this._paddingOuter;
    const [r0, r1] = this.range;
    const width = r1 - r0;
    const rawStep = width / Math.max(1, count + 2 * paddingOuter - paddingInner);
    const step = round ? Math.floor(rawStep) : rawStep;
    const fullBandWidth = step * (count - paddingInner);
    const x0 = r0 + (width - fullBandWidth) / 2;
    const start = round ? Math.round(x0) : x0;
    const bw = step * (1 - paddingInner);
    const bandwidth = round ? Math.round(bw) : bw;
    const rawBandwidth = rawStep * (1 - paddingInner);
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push(start + step * i);
    }
    this._bandwidth = bandwidth;
    this._rawBandwidth = rawBandwidth;
    this._step = step;
    this.ordinalRange = values;
  }
}
__decorate([Invalidating], BandScale.prototype, "interval", void 0);
__decorate([Invalidating], BandScale.prototype, "range", void 0);
__decorate([Invalidating], BandScale.prototype, "round", void 0);