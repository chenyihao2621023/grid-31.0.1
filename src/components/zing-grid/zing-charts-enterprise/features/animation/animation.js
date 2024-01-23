var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
const {
  BOOLEAN,
  POSITIVE_NUMBER,
  ActionOnSet,
  Validate
} = _ModuleSupport;
export class Animation extends _ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = true;
    this.animationManager = ctx.animationManager;
    this.animationManager.skip(false);
  }
}
__decorate([ActionOnSet({
  newValue(value) {
    if (this.animationManager) {
      this.animationManager.skip(!value);
    }
  }
}), Validate(BOOLEAN)], Animation.prototype, "enabled", void 0);
__decorate([ActionOnSet({
  newValue(value) {
    if (this.animationManager) {
      this.animationManager.defaultDuration = value;
      this.animationManager.skip(value === 0);
    }
  }
}), Validate(POSITIVE_NUMBER)], Animation.prototype, "duration", void 0);