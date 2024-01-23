var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
const {
  ActionOnSet,
  Validate,
  NUMBER,
  BOOLEAN,
  STRING,
  FUNCTION
} = _ModuleSupport;
const {
  BBox
} = _Scene;
const DEFAULT_LABEL_CLASS = 'zing-crosshair-label';
export const defaultLabelCss = `
.${DEFAULT_LABEL_CLASS} {
    position: absolute;
    left: 0px;
    top: 0px;
    user-select: none;
    pointer-events: none;
    font: 12px Verdana, sans-serif;
    overflow: hidden;
    white-space: nowrap;
    z-index: 99999;
    box-sizing: border-box;
}

.${DEFAULT_LABEL_CLASS}-content {
    padding: 0 7px;
    border-radius: 2px;
    line-height: 1.7em;
    background-color: rgb(71,71,71);
    color: rgb(255, 255, 255);
}

.${DEFAULT_LABEL_CLASS}-hidden {
    top: -10000px !important;
}
`;
export class CrosshairLabel {
  constructor(document, container) {
    this.enabled = true;
    this.className = undefined;
    this.xOffset = 0;
    this.yOffset = 0;
    this.format = undefined;
    this.renderer = undefined;
    this.labelRoot = container;
    const element = document.createElement('div');
    this.element = this.labelRoot.appendChild(element);
    this.element.classList.add(DEFAULT_LABEL_CLASS);
    if (CrosshairLabel.labelDocuments.indexOf(document) < 0) {
      const styleElement = document.createElement('style');
      styleElement.innerHTML = defaultLabelCss;
      document.head.insertBefore(styleElement, document.head.querySelector('style'));
      CrosshairLabel.labelDocuments.push(document);
    }
  }
  show(meta) {
    const {
      element
    } = this;
    let left = meta.x + this.xOffset;
    let top = meta.y + this.yOffset;
    const limit = (low, actual, high) => {
      return Math.max(Math.min(actual, high), low);
    };
    const containerBounds = this.getContainerBoundingBox();
    const maxLeft = containerBounds.x + containerBounds.width - element.clientWidth - 1;
    const maxTop = containerBounds.y + containerBounds.height - element.clientHeight;
    left = limit(containerBounds.x + 1, left, maxLeft);
    top = limit(containerBounds.y, top, maxTop);
    element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    this.toggle(true);
  }
  setLabelHtml(html) {
    if (html !== undefined) {
      this.element.innerHTML = html;
    }
  }
  computeBBox() {
    const {
      element
    } = this;
    return new _Scene.BBox(element.clientLeft, element.clientTop, element.clientWidth, element.clientHeight);
  }
  getContainerBoundingBox() {
    const {
      width,
      height
    } = this.labelRoot.getBoundingClientRect();
    return new BBox(0, 0, width, height);
  }
  toggle(visible) {
    this.element.classList.toggle(`${DEFAULT_LABEL_CLASS}-hidden`, !visible);
  }
  destroy() {
    const {
      parentNode
    } = this.element;
    if (parentNode) {
      parentNode.removeChild(this.element);
    }
  }
  toLabelHtml(input, defaults) {
    var _a, _b;
    if (typeof input === 'string') {
      return input;
    }
    defaults = defaults !== null && defaults !== void 0 ? defaults : {};
    const {
      text = (_a = defaults.text) !== null && _a !== void 0 ? _a : '',
      color = defaults.color,
      backgroundColor = defaults.backgroundColor,
      opacity = (_b = defaults.opacity) !== null && _b !== void 0 ? _b : 1
    } = input;
    const style = `opacity: ${opacity}; background-color: ${backgroundColor === null || backgroundColor === void 0 ? void 0 : backgroundColor.toLowerCase()}; color: ${color}`;
    return `<div class="${DEFAULT_LABEL_CLASS}-content" style="${style}">
                    <span>${text}</span>
                </div>`;
  }
}
CrosshairLabel.labelDocuments = [];
__decorate([Validate(BOOLEAN)], CrosshairLabel.prototype, "enabled", void 0);
__decorate([Validate(STRING, {
  optional: true
}), ActionOnSet({
  changeValue(newValue, oldValue) {
    if (newValue !== oldValue) {
      if (oldValue) {
        this.element.classList.remove(oldValue);
      }
      if (newValue) {
        this.element.classList.add(newValue);
      }
    }
  }
})], CrosshairLabel.prototype, "className", void 0);
__decorate([Validate(NUMBER)], CrosshairLabel.prototype, "xOffset", void 0);
__decorate([Validate(NUMBER)], CrosshairLabel.prototype, "yOffset", void 0);
__decorate([Validate(STRING, {
  optional: true
})], CrosshairLabel.prototype, "format", void 0);
__decorate([Validate(FUNCTION, {
  optional: true
})], CrosshairLabel.prototype, "renderer", void 0);