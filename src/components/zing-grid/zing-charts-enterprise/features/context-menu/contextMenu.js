var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { DEFAULT_CONTEXT_MENU_CLASS, defaultContextMenuCss } from './contextMenuStyles';
const {
  BOOLEAN,
  Validate
} = _ModuleSupport;
const TOOLTIP_ID = 'context-menu';
const PAUSE_TYPE = 'context-menu';
export class ContextMenu extends _ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = true;
    this.extraActions = [];
    this.extraNodeActions = [];
    this.x = 0;
    this.y = 0;
    this.highlightManager = ctx.highlightManager;
    this.interactionManager = ctx.interactionManager;
    this.tooltipManager = ctx.tooltipManager;
    this.scene = ctx.scene;
    this.destroyFns.push(ctx.interactionManager.addListener('contextmenu', event => this.onContextMenu(event)));
    this.groups = {
      default: [],
      node: [],
      extra: [],
      extraNode: []
    };
    this.canvasElement = ctx.scene.canvas.element;
    this.container = ctx.document.body;
    this.element = this.container.appendChild(ctx.document.createElement('div'));
    this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
    this.destroyFns.push(() => {
      var _a;
      return (_a = this.element.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.element);
    });
    this.coverElement = this.container.appendChild(ctx.document.createElement('div'));
    this.coverElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__cover`);
    this.hide();
    this.coverElement.onclick = () => this.hide();
    this.coverElement.oncontextmenu = event => {
      this.hide();
      event.preventDefault();
      this.x = event.pageX;
      this.y = event.pageY;
      this.show();
      this.reposition();
    };
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.target === this.canvasElement && entry.intersectionRatio === 0) {
            this.hide();
          }
        }
      }, {
        root: this.container
      });
      observer.observe(this.canvasElement);
      this.intersectionObserver = observer;
    }
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        if (this.menuElement && this.element.contains(this.menuElement)) {
          this.reposition();
        }
      });
      observer.observe(this.element, {
        childList: true
      });
      this.mutationObserver = observer;
    }
    if (ContextMenu.contextMenuDocuments.indexOf(ctx.document) < 0) {
      const styleElement = ctx.document.createElement('style');
      styleElement.innerHTML = defaultContextMenuCss;
      ctx.document.head.insertBefore(styleElement, ctx.document.head.querySelector('style'));
      ContextMenu.contextMenuDocuments.push(ctx.document);
    }
    ContextMenu.registerDefaultAction({
      id: 'download',
      label: 'Download',
      action: () => {
        const title = ctx.chartService.title;
        let fileName = 'image';
        if (title !== undefined && title.enabled && title.text !== undefined) {
          fileName = title.text;
        }
        this.scene.download(fileName);
      }
    });
  }
  static registerDefaultAction(action) {
    if (action.id && this.defaultActions.find(({
      id
    }) => id === action.id)) {
      return;
    }
    this.defaultActions.push(action);
  }
  static registerNodeAction(action) {
    if (action.id && this.defaultActions.find(({
      id
    }) => id === action.id)) {
      return;
    }
    this.nodeActions.push(action);
  }
  static enableAction(actionId) {
    this.disabledActions.delete(actionId);
  }
  static disableAction(actionId) {
    this.disabledActions.add(actionId);
  }
  onContextMenu(event) {
    if (!this.enabled) return;
    this.showEvent = event.sourceEvent;
    this.x = event.pageX;
    this.y = event.pageY;
    this.groups.default = [...ContextMenu.defaultActions];
    this.pickedNode = this.highlightManager.getActivePicked();
    if (this.pickedNode) {
      this.groups.node = [...ContextMenu.nodeActions];
    }
    if (this.extraActions.length > 0) {
      this.groups.extra = [...this.extraActions];
    }
    if (this.extraNodeActions.length > 0 && this.pickedNode) {
      this.groups.extraNode = [...this.extraNodeActions];
    }
    const {
      default: def,
      node,
      extra,
      extraNode
    } = this.groups;
    const groupCount = def.length + node.length + extra.length + extraNode.length;
    if (groupCount === 0) return;
    event.consume();
    event.sourceEvent.preventDefault();
    this.show();
  }
  show() {
    var _a, _b;
    if (!this.coverElement) return;
    const newMenuElement = this.renderMenu();
    if (this.menuElement) {
      this.element.replaceChild(newMenuElement, this.menuElement);
    } else {
      this.element.appendChild(newMenuElement);
    }
    this.menuElement = newMenuElement;
    this.interactionManager.pause(PAUSE_TYPE);
    this.tooltipManager.updateTooltip(TOOLTIP_ID);
    this.element.style.display = 'block';
    this.coverElement.style.display = 'block';
    this.coverElement.style.left = `${(_a = this.canvasElement.parentElement) === null || _a === void 0 ? void 0 : _a.offsetLeft}px`;
    this.coverElement.style.top = `${(_b = this.canvasElement.parentElement) === null || _b === void 0 ? void 0 : _b.offsetTop}px`;
    this.coverElement.style.width = `${this.canvasElement.clientWidth}px`;
    this.coverElement.style.height = `${this.canvasElement.clientHeight}px`;
  }
  hide() {
    if (this.menuElement) {
      this.element.removeChild(this.menuElement);
      this.menuElement = undefined;
    }
    this.interactionManager.resume(PAUSE_TYPE);
    this.tooltipManager.removeTooltip(TOOLTIP_ID);
    this.element.style.display = 'none';
    this.coverElement.style.display = 'none';
  }
  renderMenu() {
    const menuElement = this.ctx.document.createElement('div');
    menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
    this.groups.default.forEach(i => {
      const item = this.renderItem(i);
      if (item) menuElement.appendChild(item);
    });
    ['node', 'extra', 'extraNode'].forEach(group => {
      if (this.groups[group].length === 0 || ['node', 'extraNode'].includes(group) && !this.pickedNode) return;
      menuElement.appendChild(this.createDividerElement());
      this.groups[group].forEach(i => {
        const item = this.renderItem(i);
        if (item) menuElement.appendChild(item);
      });
    });
    return menuElement;
  }
  renderItem(item) {
    if (item && typeof item === 'object' && item.constructor === Object) {
      return this.createActionElement(item);
    }
  }
  createDividerElement() {
    const el = this.ctx.document.createElement('div');
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
    return el;
  }
  createActionElement({
    id,
    label,
    action
  }) {
    if (id && ContextMenu.disabledActions.has(id)) {
      return this.createDisabledElement(label);
    }
    return this.createButtonElement(label, action);
  }
  createButtonElement(label, callback) {
    const el = this.ctx.document.createElement('button');
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
    el.innerHTML = label;
    el.onclick = () => {
      var _a, _b, _c;
      const params = {
        event: this.showEvent,
        datum: (_a = this.pickedNode) === null || _a === void 0 ? void 0 : _a.datum,
        itemId: (_b = this.pickedNode) === null || _b === void 0 ? void 0 : _b.itemId,
        seriesId: (_c = this.pickedNode) === null || _c === void 0 ? void 0 : _c.series.id
      };
      callback(params);
      this.hide();
    };
    return el;
  }
  createDisabledElement(label) {
    const el = this.ctx.document.createElement('button');
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
    el.disabled = true;
    el.innerHTML = label;
    return el;
  }
  reposition() {
    const {
      x,
      y,
      ctx: {
        window
      }
    } = this;
    this.element.style.top = 'unset';
    this.element.style.bottom = 'unset';
    this.element.style.left = 'unset';
    this.element.style.right = 'unset';
    if (x + this.element.offsetWidth > window.innerWidth) {
      this.element.style.right = `calc(100% - ${x - 1}px)`;
    } else {
      this.element.style.left = `${x + 1}px`;
    }
    if (y + this.element.offsetHeight > window.innerHeight) {
      this.element.style.bottom = `calc(100% - ${y}px - 0.5em)`;
    } else {
      this.element.style.top = `calc(${y}px - 0.5em)`;
    }
  }
  destroy() {
    var _a, _b;
    super.destroy();
    (_a = this.intersectionObserver) === null || _a === void 0 ? void 0 : _a.unobserve(this.canvasElement);
    (_b = this.mutationObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
  }
}
ContextMenu.contextMenuDocuments = [];
ContextMenu.defaultActions = [];
ContextMenu.nodeActions = [];
ContextMenu.disabledActions = new Set();
__decorate([Validate(BOOLEAN)], ContextMenu.prototype, "enabled", void 0);