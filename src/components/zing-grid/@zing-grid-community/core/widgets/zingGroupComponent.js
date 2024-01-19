var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from './component';
import { RefSelector } from './componentAnnotations';
import { PostConstruct } from '../context/context';
import { createIcon } from '../utils/icon';
import { setDisplayed } from '../utils/dom';
import { KeyCode } from '../constants/keyCode';
import { setAriaExpanded } from '../utils/aria';
export class ZingGroupComponent extends Component {
    constructor(params = {}) {
        super(ZingGroupComponent.getTemplate(params));
        this.suppressEnabledCheckbox = true;
        this.suppressOpenCloseIcons = false;
        const { title, enabled, items, suppressEnabledCheckbox, suppressOpenCloseIcons } = params;
        this.title = title;
        this.cssIdentifier = params.cssIdentifier || 'default';
        this.enabled = enabled != null ? enabled : true;
        this.items = items || [];
        this.alignItems = params.alignItems || 'center';
        if (suppressEnabledCheckbox != null) {
            this.suppressEnabledCheckbox = suppressEnabledCheckbox;
        }
        if (suppressOpenCloseIcons != null) {
            this.suppressOpenCloseIcons = suppressOpenCloseIcons;
        }
    }
    static getTemplate(params) {
        const cssIdentifier = params.cssIdentifier || 'default';
        const direction = params.direction || 'vertical';
        return /* html */ `<div class="zing-group zing-${cssIdentifier}-group" role="presentation">
            <div class="zing-group-title-bar zing-${cssIdentifier}-group-title-bar zing-unselectable" ref="eTitleBar" role="button">
                <span class="zing-group-title-bar-icon zing-${cssIdentifier}-group-title-bar-icon" ref="eGroupOpenedIcon" role="presentation"></span>
                <span class="zing-group-title-bar-icon zing-${cssIdentifier}-group-title-bar-icon" ref="eGroupClosedIcon" role="presentation"></span>
                <span ref="eTitle" class="zing-group-title zing-${cssIdentifier}-group-title"></span>
            </div>
            <div ref="eToolbar" class="zing-group-toolbar zing-${cssIdentifier}-group-toolbar">
                <zing-checkbox ref="cbGroupEnabled"></zing-checkbox>
            </div>
            <div ref="eContainer" class="zing-group-container zing-group-container-${direction} zing-${cssIdentifier}-group-container"></div>
        </div>`;
    }
    postConstruct() {
        if (this.items.length) {
            const initialItems = this.items;
            this.items = [];
            this.addItems(initialItems);
        }
        const localeTextFunc = this.localeService.getLocaleTextFunc();
        this.cbGroupEnabled.setLabel(localeTextFunc('enabled', 'Enabled'));
        if (this.title) {
            this.setTitle(this.title);
        }
        if (this.enabled) {
            this.setEnabled(this.enabled);
        }
        this.setAlignItems(this.alignItems);
        this.hideEnabledCheckbox(this.suppressEnabledCheckbox);
        this.hideOpenCloseIcons(this.suppressOpenCloseIcons);
        this.setupExpandContract();
        this.refreshAriaStatus();
        this.refreshChildDisplay();
    }
    setupExpandContract() {
        this.eGroupClosedIcon.appendChild(createIcon('columnSelectClosed', this.gridOptionsService, null));
        this.eGroupOpenedIcon.appendChild(createIcon('columnSelectOpen', this.gridOptionsService, null));
        this.addManagedListener(this.eTitleBar, 'click', () => this.toggleGroupExpand());
        this.addManagedListener(this.eTitleBar, 'keydown', (e) => {
            switch (e.key) {
                case KeyCode.ENTER:
                case KeyCode.SPACE:
                    e.preventDefault();
                    this.toggleGroupExpand();
                    break;
                case KeyCode.RIGHT:
                case KeyCode.LEFT:
                    e.preventDefault();
                    this.toggleGroupExpand(e.key === KeyCode.RIGHT);
                    break;
            }
        });
    }
    refreshAriaStatus() {
        if (!this.suppressOpenCloseIcons) {
            setAriaExpanded(this.eTitleBar, this.expanded);
        }
    }
    refreshChildDisplay() {
        const showIcon = !this.suppressOpenCloseIcons;
        setDisplayed(this.eToolbar, this.expanded && !this.suppressEnabledCheckbox);
        setDisplayed(this.eGroupOpenedIcon, showIcon && this.expanded);
        setDisplayed(this.eGroupClosedIcon, showIcon && !this.expanded);
    }
    isExpanded() {
        return this.expanded;
    }
    setAlignItems(alignment) {
        if (this.alignItems !== alignment) {
            this.removeCssClass(`zing-group-item-alignment-${this.alignItems}`);
        }
        this.alignItems = alignment;
        const newCls = `zing-group-item-alignment-${this.alignItems}`;
        this.addCssClass(newCls);
        return this;
    }
    toggleGroupExpand(expanded) {
        if (this.suppressOpenCloseIcons) {
            this.expanded = true;
            this.refreshChildDisplay();
            setDisplayed(this.eContainer, true);
            return this;
        }
        expanded = expanded != null ? expanded : !this.expanded;
        if (this.expanded === expanded) {
            return this;
        }
        this.expanded = expanded;
        this.refreshAriaStatus();
        this.refreshChildDisplay();
        setDisplayed(this.eContainer, expanded);
        this.dispatchEvent({ type: this.expanded ? ZingGroupComponent.EVENT_EXPANDED : ZingGroupComponent.EVENT_COLLAPSED });
        return this;
    }
    addItems(items) {
        items.forEach(item => this.addItem(item));
    }
    addItem(item) {
        const container = this.eContainer;
        const el = item instanceof Component ? item.getGui() : item;
        el.classList.add('zing-group-item', `zing-${this.cssIdentifier}-group-item`);
        container.appendChild(el);
        this.items.push(el);
    }
    hideItem(hide, index) {
        const itemToHide = this.items[index];
        setDisplayed(itemToHide, !hide);
    }
    setTitle(title) {
        this.eTitle.innerText = title;
        return this;
    }
    addCssClassToTitleBar(cssClass) {
        this.eTitleBar.classList.add(cssClass);
    }
    setEnabled(enabled, skipToggle) {
        this.enabled = enabled;
        this.refreshDisabledStyles();
        this.toggleGroupExpand(enabled);
        if (!skipToggle) {
            this.cbGroupEnabled.setValue(enabled);
        }
        return this;
    }
    isEnabled() {
        return this.enabled;
    }
    onEnableChange(callbackFn) {
        this.cbGroupEnabled.onValueChange((newSelection) => {
            this.setEnabled(newSelection, true);
            callbackFn(newSelection);
        });
        return this;
    }
    hideEnabledCheckbox(hide) {
        this.suppressEnabledCheckbox = hide;
        this.refreshChildDisplay();
        this.refreshDisabledStyles();
        return this;
    }
    hideOpenCloseIcons(hide) {
        this.suppressOpenCloseIcons = hide;
        if (hide) {
            this.toggleGroupExpand(true);
        }
        return this;
    }
    refreshDisabledStyles() {
        this.addOrRemoveCssClass('zing-disabled', !this.enabled);
        if (this.suppressEnabledCheckbox && !this.enabled) {
            this.eTitleBar.classList.add('zing-disabled-group-title-bar');
            this.eTitleBar.removeAttribute('tabindex');
        }
        else {
            this.eTitleBar.classList.remove('zing-disabled-group-title-bar');
            this.eTitleBar.setAttribute('tabindex', '0');
        }
        this.eContainer.classList.toggle('zing-disabled-group-container', !this.enabled);
    }
}
ZingGroupComponent.EVENT_EXPANDED = 'expanded';
ZingGroupComponent.EVENT_COLLAPSED = 'collapsed';
__decorate([
    RefSelector('eTitleBar')
], ZingGroupComponent.prototype, "eTitleBar", void 0);
__decorate([
    RefSelector('eGroupOpenedIcon')
], ZingGroupComponent.prototype, "eGroupOpenedIcon", void 0);
__decorate([
    RefSelector('eGroupClosedIcon')
], ZingGroupComponent.prototype, "eGroupClosedIcon", void 0);
__decorate([
    RefSelector('eToolbar')
], ZingGroupComponent.prototype, "eToolbar", void 0);
__decorate([
    RefSelector('cbGroupEnabled')
], ZingGroupComponent.prototype, "cbGroupEnabled", void 0);
__decorate([
    RefSelector('eTitle')
], ZingGroupComponent.prototype, "eTitle", void 0);
__decorate([
    RefSelector('eContainer')
], ZingGroupComponent.prototype, "eContainer", void 0);
__decorate([
    PostConstruct
], ZingGroupComponent.prototype, "postConstruct", null);
//# sourceMappingURL=zingGroupComponent.js.map