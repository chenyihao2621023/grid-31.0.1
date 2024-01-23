var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PointerEvents } from '../scene/node';
import { Text } from '../scene/shape/text';
import { createId } from '../util/id';
import { BaseProperties } from '../util/properties';
import { ProxyPropertyOnWrite } from '../util/proxy';
import { BOOLEAN, COLOR_STRING, FONT_STYLE, FONT_WEIGHT, POSITIVE_NUMBER, STRING, TEXT_ALIGN, TEXT_WRAP, Validate } from '../util/validation';
import { toTooltipHtml } from './tooltip/tooltip';
export class Caption extends BaseProperties {
  constructor() {
    super(...arguments);
    this.id = createId(this);
    this.node = new Text().setProperties({
      textAlign: 'center',
      pointerEvents: PointerEvents.None
    });
    this.enabled = false;
    this.textAlign = 'center';
    this.fontSize = 10;
    this.fontFamily = 'sans-serif';
    this.wrapping = 'always';
    this.truncated = false;
  }
  registerInteraction(moduleCtx) {
    return moduleCtx.interactionManager.addListener('hover', event => this.handleMouseMove(moduleCtx, event));
  }
  computeTextWrap(containerWidth, containerHeight) {
    var _a, _b;
    const {
      text,
      wrapping
    } = this;
    const maxWidth = Math.min((_a = this.maxWidth) !== null && _a !== void 0 ? _a : Infinity, containerWidth);
    const maxHeight = (_b = this.maxHeight) !== null && _b !== void 0 ? _b : containerHeight;
    if (!isFinite(maxWidth) && !isFinite(maxHeight)) {
      this.node.text = text;
      return;
    }
    const {
      text: wrappedText,
      truncated
    } = Text.wrap(text !== null && text !== void 0 ? text : '', maxWidth, maxHeight, this, wrapping);
    this.node.text = wrappedText;
    this.truncated = truncated;
  }
  handleMouseMove(moduleCtx, event) {
    if (!this.enabled) {
      return;
    }
    const bbox = this.node.computeBBox();
    const {
      pageX,
      pageY,
      offsetX,
      offsetY
    } = event;
    const pointerInsideCaption = this.node.visible && bbox.containsPoint(offsetX, offsetY);
    if (!pointerInsideCaption) {
      moduleCtx.tooltipManager.removeTooltip(this.id);
      return;
    }
    event.consume();
    if (!this.truncated) {
      moduleCtx.tooltipManager.removeTooltip(this.id);
      return;
    }
    moduleCtx.tooltipManager.updateTooltip(this.id, {
      pageX,
      pageY,
      offsetX,
      offsetY,
      event,
      showArrow: false,
      addCustomClass: false
    }, toTooltipHtml({
      content: this.text
    }));
  }
}
Caption.SMALL_PADDING = 10;
Caption.LARGE_PADDING = 20;
__decorate([Validate(BOOLEAN)], Caption.prototype, "enabled", void 0);
__decorate([Validate(STRING, {
  optional: true
}), ProxyPropertyOnWrite('node')], Caption.prototype, "text", void 0);
__decorate([Validate(TEXT_ALIGN, {
  optional: true
}), ProxyPropertyOnWrite('node')], Caption.prototype, "textAlign", void 0);
__decorate([Validate(FONT_STYLE, {
  optional: true
}), ProxyPropertyOnWrite('node')], Caption.prototype, "fontStyle", void 0);
__decorate([Validate(FONT_WEIGHT, {
  optional: true
}), ProxyPropertyOnWrite('node')], Caption.prototype, "fontWeight", void 0);
__decorate([Validate(POSITIVE_NUMBER), ProxyPropertyOnWrite('node')], Caption.prototype, "fontSize", void 0);
__decorate([Validate(STRING), ProxyPropertyOnWrite('node')], Caption.prototype, "fontFamily", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
}), ProxyPropertyOnWrite('node', 'fill')], Caption.prototype, "color", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], Caption.prototype, "spacing", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], Caption.prototype, "lineHeight", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], Caption.prototype, "maxWidth", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], Caption.prototype, "maxHeight", void 0);
__decorate([Validate(TEXT_WRAP)], Caption.prototype, "wrapping", void 0);