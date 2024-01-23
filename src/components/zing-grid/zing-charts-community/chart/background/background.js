var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseModuleInstance } from '../../module/module';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { BOOLEAN, COLOR_STRING, Validate } from '../../util/validation';
import { Layers } from '../layers';
export class Background extends BaseModuleInstance {
  constructor(ctx) {
    var _a;
    super();
    this.node = new Group({
      name: 'background',
      zIndex: Layers.SERIES_BACKGROUND_ZINDEX
    });
    this.rectNode = new Rect();
    this.visible = true;
    this.fill = 'white';
    this.image = undefined;
    this.node.appendChild(this.rectNode);
    (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(this.node);
    this.destroyFns.push(() => {
      var _a;
      return (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(this.node);
    }, ctx.layoutService.addListener('layout-complete', e => this.onLayoutComplete(e)));
  }
  onLayoutComplete(e) {
    const {
      width,
      height
    } = e.chart;
    this.rectNode.width = width;
    this.rectNode.height = height;
  }
}
__decorate([Validate(BOOLEAN), ProxyPropertyOnWrite('node', 'visible')], Background.prototype, "visible", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
}), ProxyPropertyOnWrite('rectNode', 'fill')], Background.prototype, "fill", void 0);