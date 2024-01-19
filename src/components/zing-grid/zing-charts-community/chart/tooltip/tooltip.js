var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BBox } from '../../scene/bbox';
import { injectStyle } from '../../util/dom';
import { BaseProperties } from '../../util/properties';
import { BOOLEAN, INTERACTION_RANGE, NUMBER, POSITIVE_NUMBER, STRING, TEXT_WRAP, UNION, Validate, } from '../../util/validation';
const DEFAULT_TOOLTIP_CLASS = 'zing-chart-tooltip';
const DEFAULT_TOOLTIP_DARK_CLASS = 'zing-chart-dark-tooltip';
const defaultTooltipCss = `
.${DEFAULT_TOOLTIP_CLASS} {
    transition: transform 0.1s ease;
    max-width: 100%;
    position: fixed;
    left: 0px;
    top: 0px;
    z-index: 99999;
    font: 12px Verdana, sans-serif;
    color: rgb(70, 70, 70);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-always {
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: none;
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-hyphenate {
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-on-space {
    overflow-wrap: normal;
    word-break: normal;
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-never {
    white-space: pre;
    text-overflow: ellipsis;
}

.${DEFAULT_TOOLTIP_CLASS}-no-interaction {
    pointer-events: none;
    user-select: none;
}

.${DEFAULT_TOOLTIP_CLASS}-no-animation {
    transition: none !important;
}

.${DEFAULT_TOOLTIP_CLASS}-hidden {
    visibility: hidden;
}

.${DEFAULT_TOOLTIP_CLASS}-title {
    overflow: hidden;
    position: relative;
    padding: 8px 14px;
    border-top-left-radius: 2px;
    border-top-right-radius: 2px;
    color: white;
    background-color: #888888;
    z-index: 1;
    text-overflow: inherit;
}

.${DEFAULT_TOOLTIP_CLASS}-title:only-child {
    border-bottom-left-radius: 2px;
    border-bottom-right-radius: 2px;
}

.${DEFAULT_TOOLTIP_CLASS}-content {
    overflow: hidden;
    padding: 6px 14px;
    line-height: 1.7em;
    background: white;
    border-bottom-left-radius: 2px;
    border-bottom-right-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    overflow: hidden;
    text-overflow: inherit;
}

.${DEFAULT_TOOLTIP_CLASS}-arrow::before {
    content: "";

    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    border: 5px solid #d9d9d9;

    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;

    width: 0;
    height: 0;

    margin: 0 auto;
}

.${DEFAULT_TOOLTIP_CLASS}-arrow::after {
    content: "";

    position: absolute;
    top: calc(100% - 1px);
    left: 50%;
    transform: translateX(-50%);

    border: 5px solid white;

    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;

    width: 0;
    height: 0;

    margin: 0 auto;
}

.${DEFAULT_TOOLTIP_CLASS}.${DEFAULT_TOOLTIP_DARK_CLASS} {
    color: white;
    background: #15181c;
}

.${DEFAULT_TOOLTIP_CLASS}.${DEFAULT_TOOLTIP_DARK_CLASS} .${DEFAULT_TOOLTIP_CLASS}-content {
    border-color: rgba(255, 255, 255, 0.15);
}

.zing-chart-wrapper {
    box-sizing: border-box;
    overflow: hidden;
}
`;
export function toTooltipHtml(input, defaults) {
    var _a, _b, _c;
    if (typeof input === 'string') {
        return input;
    }
    const { content = (_a = defaults === null || defaults === void 0 ? void 0 : defaults.content) !== null && _a !== void 0 ? _a : '', title = defaults === null || defaults === void 0 ? void 0 : defaults.title, color = (_b = defaults === null || defaults === void 0 ? void 0 : defaults.color) !== null && _b !== void 0 ? _b : 'white', backgroundColor = (_c = defaults === null || defaults === void 0 ? void 0 : defaults.backgroundColor) !== null && _c !== void 0 ? _c : '#888', } = input;
    const titleHtml = title
        ? `<div class="${DEFAULT_TOOLTIP_CLASS}-title"
        style="color: ${color}; background-color: ${backgroundColor}">${title}</div>`
        : '';
    const contentHtml = content ? `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${content}</div>` : '';
    return `${titleHtml}${contentHtml}`;
}
export class TooltipPosition extends BaseProperties {
    constructor() {
        super(...arguments);
        this.type = 'pointer';
        this.xOffset = 0;
        this.yOffset = 0;
    }
}
__decorate([
    Validate(UNION(['pointer', 'node'], 'a position type'))
    /** The type of positioning for the tooltip. By default, the tooltip follows the pointer. */
], TooltipPosition.prototype, "type", void 0);
__decorate([
    Validate(NUMBER)
    /** The horizontal offset in pixels for the position of the tooltip. */
], TooltipPosition.prototype, "xOffset", void 0);
__decorate([
    Validate(NUMBER)
    /** The vertical offset in pixels for the position of the tooltip. */
], TooltipPosition.prototype, "yOffset", void 0);
export class Tooltip {
    constructor(canvasElement, document, window, container) {
        this.enableInteraction = false;
        this.enabled = true;
        this.showArrow = undefined;
        this.class = undefined;
        this.lastClass = undefined;
        this.delay = 0;
        this.range = 'nearest';
        this.wrapping = 'hyphenate';
        this.lastVisibilityChange = Date.now();
        this.position = new TooltipPosition();
        this.showTimeout = 0;
        this._showArrow = true;
        this.tooltipRoot = container;
        this.window = window;
        const element = document.createElement('div');
        this.element = this.tooltipRoot.appendChild(element);
        this.element.classList.add(DEFAULT_TOOLTIP_CLASS);
        this.canvasElement = canvasElement;
        // Detect when the chart becomes invisible and hide the tooltip as well.
        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === this.canvasElement && entry.intersectionRatio === 0) {
                        this.toggle(false);
                    }
                }
            }, { root: this.tooltipRoot });
            observer.observe(this.canvasElement);
            this.observer = observer;
        }
        if (Tooltip.tooltipDocuments.indexOf(document) < 0) {
            injectStyle(document, defaultTooltipCss);
            Tooltip.tooltipDocuments.push(document);
        }
    }
    destroy() {
        const { parentNode } = this.element;
        if (parentNode) {
            parentNode.removeChild(this.element);
        }
        if (this.observer) {
            this.observer.unobserve(this.canvasElement);
        }
    }
    isVisible() {
        const { element } = this;
        return !element.classList.contains(DEFAULT_TOOLTIP_CLASS + '-hidden');
    }
    updateClass(visible, showArrow, addCustomClass = true) {
        const { element, class: newClass, lastClass, enableInteraction, lastVisibilityChange } = this;
        const wasVisible = this.isVisible();
        const nowVisible = !!visible;
        let timeSinceLastVisibilityChangeMs = Infinity;
        if (wasVisible !== nowVisible) {
            const now = Date.now();
            timeSinceLastVisibilityChangeMs = now - lastVisibilityChange;
            this.lastVisibilityChange = now;
        }
        const toggleClass = (name, include) => {
            const className = `${DEFAULT_TOOLTIP_CLASS}-${name}`;
            if (include) {
                element.classList.add(className);
            }
            else {
                element.classList.remove(className);
            }
        };
        // Time below which an animated move should be used.
        const animatedMoveThresholdMs = 100;
        // Time below which we should treat updates as indistinguishable to users, and we shouldn't
        // adjust the `no-animation` CSS class.
        const thrashingThresholdMs = 5;
        // No animation on first show or if tooltip is disabled for a non-trivial amount of time.
        // Don't change the `no-animation` class on fast update.
        const noAnimation = !wasVisible && nowVisible && timeSinceLastVisibilityChangeMs > animatedMoveThresholdMs;
        if (timeSinceLastVisibilityChangeMs > thrashingThresholdMs) {
            toggleClass('no-animation', noAnimation);
        }
        toggleClass('no-interaction', !enableInteraction); // Prevent interaction.
        toggleClass('hidden', !visible); // Hide if not visible.
        toggleClass('arrow', !!showArrow); // Add arrow if tooltip is constrained.
        this.updateWrapping();
        if (addCustomClass) {
            if (newClass !== lastClass) {
                if (lastClass) {
                    element.classList.remove(lastClass);
                }
                if (newClass) {
                    element.classList.add(newClass);
                }
            }
            this.lastClass = newClass;
        }
        else {
            if (lastClass) {
                element.classList.remove(lastClass);
            }
            this.lastClass = undefined;
        }
    }
    updateWrapping() {
        const { element, wrapping } = this;
        const wrappingOptions = {
            always: false,
            hyphenate: false,
            'on-space': false,
            never: false,
        };
        wrappingOptions[wrapping] = true;
        Object.entries(wrappingOptions).forEach(([name, force]) => {
            element.classList.toggle(`${DEFAULT_TOOLTIP_CLASS}-wrap-${name}`, force);
        });
    }
    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(meta, html, instantly = false) {
        var _a, _b, _c, _d, _e, _f, _g;
        const { element, canvasElement } = this;
        if (html !== undefined) {
            element.innerHTML = html;
        }
        else if (!element.innerHTML) {
            this.toggle(false);
            return;
        }
        const limit = (low, actual, high) => {
            return Math.max(Math.min(actual, high), low);
        };
        const xOffset = (_b = (_a = meta.position) === null || _a === void 0 ? void 0 : _a.xOffset) !== null && _b !== void 0 ? _b : 0;
        const yOffset = (_d = (_c = meta.position) === null || _c === void 0 ? void 0 : _c.yOffset) !== null && _d !== void 0 ? _d : 0;
        const canvasRect = canvasElement.getBoundingClientRect();
        const naiveLeft = canvasRect.left + meta.offsetX - element.clientWidth / 2 + xOffset;
        const naiveTop = canvasRect.top + meta.offsetY - element.clientHeight - 8 + yOffset;
        const windowBounds = this.getWindowBoundingBox();
        const maxLeft = windowBounds.x + windowBounds.width - element.clientWidth - 1;
        const maxTop = windowBounds.y + windowBounds.height - element.clientHeight;
        const left = limit(windowBounds.x, naiveLeft, maxLeft);
        const top = limit(windowBounds.y, naiveTop, maxTop);
        const constrained = left !== naiveLeft || top !== naiveTop;
        const defaultShowArrow = !constrained && !xOffset && !yOffset;
        const showArrow = (_f = (_e = meta.showArrow) !== null && _e !== void 0 ? _e : this.showArrow) !== null && _f !== void 0 ? _f : defaultShowArrow;
        this.updateShowArrow(showArrow);
        element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
        this.enableInteraction = (_g = meta.enableInteraction) !== null && _g !== void 0 ? _g : false;
        if (this.delay > 0 && !instantly) {
            this.toggle(false);
            this.showTimeout = this.window.setTimeout(() => {
                this.toggle(true, meta.addCustomClass);
            }, this.delay);
            return;
        }
        this.toggle(true, meta.addCustomClass);
    }
    getWindowBoundingBox() {
        return new BBox(0, 0, this.window.innerWidth, this.window.innerHeight);
    }
    toggle(visible, addCustomClass) {
        if (!visible) {
            this.window.clearTimeout(this.showTimeout);
        }
        this.updateClass(visible, this._showArrow, addCustomClass);
    }
    pointerLeftOntoTooltip(event) {
        var _a;
        if (!this.enableInteraction)
            return false;
        const classList = (_a = event.sourceEvent.relatedTarget) === null || _a === void 0 ? void 0 : _a.classList;
        const classes = ['', '-title', '-content'];
        const classListContains = Boolean(classes.filter((c) => classList === null || classList === void 0 ? void 0 : classList.contains(`${DEFAULT_TOOLTIP_CLASS}${c}`)));
        return classList !== undefined && classListContains;
    }
    updateShowArrow(show) {
        this._showArrow = show;
    }
}
Tooltip.tooltipDocuments = [];
__decorate([
    Validate(BOOLEAN)
], Tooltip.prototype, "enabled", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], Tooltip.prototype, "showArrow", void 0);
__decorate([
    Validate(STRING, { optional: true })
], Tooltip.prototype, "class", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], Tooltip.prototype, "delay", void 0);
__decorate([
    Validate(INTERACTION_RANGE)
], Tooltip.prototype, "range", void 0);
__decorate([
    Validate(TEXT_WRAP)
], Tooltip.prototype, "wrapping", void 0);
//# sourceMappingURL=tooltip.js.map