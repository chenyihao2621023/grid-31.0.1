var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { FUNCTION, STRING, Validate } from '../../util/validation';
export class Overlay {
    constructor(className, parentElement) {
        this.className = className;
        this.parentElement = parentElement;
    }
    show(rect) {
        var _a, _b;
        if (!this.element) {
            this.element = this.createElement('div');
            this.element.className = this.className;
        }
        const { element } = this;
        element.style.position = 'absolute';
        element.style.left = `${rect.x}px`;
        element.style.top = `${rect.y}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
        if (this.renderer) {
            element.innerHTML = this.renderer();
        }
        else {
            const content = this.createElement('div');
            content.style.alignItems = 'center';
            content.style.boxSizing = 'border-box';
            content.style.display = 'flex';
            content.style.justifyContent = 'center';
            content.style.margin = '8px';
            content.style.height = '100%';
            content.style.font = '12px Verdana, sans-serif';
            content.innerText = (_a = this.text) !== null && _a !== void 0 ? _a : 'No data to display';
            element.replaceChildren(content);
        }
        (_b = this.parentElement) === null || _b === void 0 ? void 0 : _b.append(element);
    }
    hide() {
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.remove();
        this.element = undefined;
    }
    createElement(tagName, options) {
        return this.parentElement.ownerDocument.createElement(tagName, options);
    }
}
__decorate([
    Validate(FUNCTION, { optional: true })
], Overlay.prototype, "renderer", void 0);
__decorate([
    Validate(STRING, { optional: true })
], Overlay.prototype, "text", void 0);
//# sourceMappingURL=overlay.js.map