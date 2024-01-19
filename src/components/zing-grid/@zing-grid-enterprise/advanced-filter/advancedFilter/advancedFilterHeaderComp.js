var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, Events, KeyCode, PostConstruct, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { AdvancedFilterComp } from "./advancedFilterComp";
export class AdvancedFilterHeaderComp extends Component {
    constructor(enabled) {
        super(/* html */ `
            <div class="zing-advanced-filter-header" role="row">
            </div>`);
        this.enabled = enabled;
    }
    postConstruct() {
        this.setupAdvancedFilter(this.enabled);
        this.addDestroyFunc(() => this.destroyBean(this.eAdvancedFilter));
        this.addManagedListener(this.eventService, Events.EVENT_GRID_COLUMNS_CHANGED, () => this.onGridColumnsChanged());
        this.addGuiEventListener('keydown', (event) => this.onKeyDown(event));
        this.addGuiEventListener('focusout', (event) => {
            if (!this.getFocusableElement().contains(event.relatedTarget)) {
                this.focusService.clearAdvancedFilterColumn();
            }
        });
    }
    getFocusableElement() {
        var _a, _b;
        return (_b = (_a = this.eAdvancedFilter) === null || _a === void 0 ? void 0 : _a.getGui()) !== null && _b !== void 0 ? _b : this.getGui();
    }
    setEnabled(enabled) {
        if (enabled === this.enabled) {
            return;
        }
        this.setupAdvancedFilter(enabled);
    }
    refresh() {
        var _a;
        (_a = this.eAdvancedFilter) === null || _a === void 0 ? void 0 : _a.refresh();
    }
    getHeight() {
        return this.height;
    }
    setInputDisabled(disabled) {
        var _a;
        (_a = this.eAdvancedFilter) === null || _a === void 0 ? void 0 : _a.setInputDisabled(disabled);
    }
    setupAdvancedFilter(enabled) {
        const eGui = this.getGui();
        if (enabled) {
            // unmanaged as can be recreated
            this.eAdvancedFilter = this.createBean(new AdvancedFilterComp());
            const eAdvancedFilterGui = this.eAdvancedFilter.getGui();
            this.eAdvancedFilter.addCssClass('zing-advanced-filter-header-cell');
            this.height = this.columnModel.getFloatingFiltersHeight();
            const height = `${this.height}px`;
            eGui.style.height = height;
            eGui.style.minHeight = height;
            this.setAriaRowIndex();
            _.setAriaRole(eAdvancedFilterGui, 'gridcell');
            _.setAriaColIndex(eAdvancedFilterGui, 1);
            this.setAriaColumnCount(eAdvancedFilterGui);
            eGui.appendChild(eAdvancedFilterGui);
        }
        else {
            _.clearElement(eGui);
            this.destroyBean(this.eAdvancedFilter);
            this.height = 0;
        }
        _.setDisplayed(eGui, enabled);
        this.enabled = enabled;
    }
    setAriaColumnCount(eAdvancedFilterGui) {
        _.setAriaColSpan(eAdvancedFilterGui, this.columnModel.getAllGridColumns().length);
    }
    setAriaRowIndex() {
        _.setAriaRowIndex(this.getGui(), this.headerNavigationService.getHeaderRowCount());
    }
    onGridColumnsChanged() {
        if (!this.eAdvancedFilter) {
            return;
        }
        this.setAriaColumnCount(this.eAdvancedFilter.getGui());
        this.setAriaRowIndex();
    }
    onKeyDown(event) {
        switch (event.key) {
            case KeyCode.ENTER: {
                if (this.hasFocus()) {
                    if (this.focusService.focusInto(this.getFocusableElement())) {
                        event.preventDefault();
                    }
                }
                break;
            }
            case KeyCode.ESCAPE:
                if (!this.hasFocus()) {
                    this.getFocusableElement().focus();
                }
                break;
            case KeyCode.UP:
                this.navigateUpDown(true, event);
                break;
            case KeyCode.DOWN:
                this.navigateUpDown(false, event);
                break;
            case KeyCode.TAB:
                if (this.hasFocus()) {
                    this.navigateLeftRight(event);
                }
                else {
                    const nextFocusableEl = this.focusService.findNextFocusableElement(this.getFocusableElement(), null, event.shiftKey);
                    if (nextFocusableEl) {
                        event.preventDefault();
                        nextFocusableEl.focus();
                    }
                    else {
                        this.navigateLeftRight(event);
                    }
                }
                break;
        }
    }
    navigateUpDown(backwards, event) {
        if (this.hasFocus()) {
            if (this.focusService.focusNextFromAdvancedFilter(backwards)) {
                event.preventDefault();
            }
            ;
        }
    }
    navigateLeftRight(event) {
        if (event.shiftKey
            ? this.focusService.focusLastHeader()
            : this.focusService.focusNextFromAdvancedFilter(false, true)) {
            event.preventDefault();
        }
    }
    hasFocus() {
        const eDocument = this.gridOptionsService.getDocument();
        return eDocument.activeElement === this.getFocusableElement();
    }
}
__decorate([
    Autowired('columnModel')
], AdvancedFilterHeaderComp.prototype, "columnModel", void 0);
__decorate([
    Autowired('focusService')
], AdvancedFilterHeaderComp.prototype, "focusService", void 0);
__decorate([
    Autowired('headerNavigationService')
], AdvancedFilterHeaderComp.prototype, "headerNavigationService", void 0);
__decorate([
    PostConstruct
], AdvancedFilterHeaderComp.prototype, "postConstruct", null);
//# sourceMappingURL=advancedFilterHeaderComp.js.map