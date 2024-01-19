var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ZingDialog, Autowired, BeanStub, Events, PostConstruct, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { AdvancedFilterHeaderComp } from "./advancedFilterHeaderComp";
import { AdvancedFilterComp } from "./advancedFilterComp";
import { AdvancedFilterBuilderComp } from "./builder/advancedFilterBuilderComp";
export class AdvancedFilterCtrl extends BeanStub {
    constructor(enabled) {
        super();
        this.enabled = enabled;
    }
    postConstruct() {
        this.hasAdvancedFilterParent = !!this.gridOptionsService.get('advancedFilterParent');
        this.ctrlsService.whenReady(() => this.setAdvancedFilterComp());
        this.addManagedListener(this.eventService, Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED, ({ enabled }) => this.onEnabledChanged(enabled));
        this.addManagedPropertyListener('advancedFilterParent', () => this.updateComps());
        this.addDestroyFunc(() => {
            this.destroyAdvancedFilterComp();
            this.destroyBean(this.eBuilderComp);
            if (this.eBuilderDialog && this.eBuilderDialog.isAlive()) {
                this.destroyBean(this.eBuilderDialog);
            }
        });
    }
    setupHeaderComp(eCompToInsertBefore) {
        this.eHeaderComp = this.createManagedBean(new AdvancedFilterHeaderComp(this.enabled && !this.hasAdvancedFilterParent));
        eCompToInsertBefore.insertAdjacentElement('beforebegin', this.eHeaderComp.getGui());
    }
    focusHeaderComp() {
        if (this.eHeaderComp) {
            this.eHeaderComp.getFocusableElement().focus();
            return true;
        }
        return false;
    }
    refreshComp() {
        var _a, _b;
        (_a = this.eFilterComp) === null || _a === void 0 ? void 0 : _a.refresh();
        (_b = this.eHeaderComp) === null || _b === void 0 ? void 0 : _b.refresh();
    }
    refreshBuilderComp() {
        var _a;
        (_a = this.eBuilderComp) === null || _a === void 0 ? void 0 : _a.refresh();
    }
    getHeaderHeight() {
        var _a, _b;
        return (_b = (_a = this.eHeaderComp) === null || _a === void 0 ? void 0 : _a.getHeight()) !== null && _b !== void 0 ? _b : 0;
    }
    setInputDisabled(disabled) {
        var _a, _b;
        (_a = this.eFilterComp) === null || _a === void 0 ? void 0 : _a.setInputDisabled(disabled);
        (_b = this.eHeaderComp) === null || _b === void 0 ? void 0 : _b.setInputDisabled(disabled);
    }
    toggleFilterBuilder(source, force) {
        if ((force && this.eBuilderDialog) || (force === false && !this.eBuilderDialog)) {
            // state requested is already active
            return;
        }
        if (this.eBuilderDialog) {
            this.builderDestroySource = source;
            this.destroyBean(this.eBuilderDialog);
            return;
        }
        this.setInputDisabled(true);
        const { width, height, minWidth } = this.getBuilderDialogSize();
        this.eBuilderComp = this.createBean(new AdvancedFilterBuilderComp());
        this.eBuilderDialog = this.createBean(new ZingDialog({
            title: this.advancedFilterExpressionService.translate('advancedFilterBuilderTitle'),
            component: this.eBuilderComp,
            width,
            height,
            resizable: true,
            movable: true,
            maximizable: true,
            centered: true,
            closable: true,
            minWidth,
            afterGuiAttached: () => { var _a; return (_a = this.eBuilderComp) === null || _a === void 0 ? void 0 : _a.afterGuiAttached(); }
        }));
        this.dispatchFilterBuilderVisibleChangedEvent(source, true);
        this.eBuilderDialog.addEventListener(ZingDialog.EVENT_DESTROYED, () => {
            var _a;
            this.destroyBean(this.eBuilderComp);
            this.eBuilderComp = undefined;
            this.eBuilderDialog = undefined;
            this.setInputDisabled(false);
            this.dispatchEvent({
                type: AdvancedFilterCtrl.EVENT_BUILDER_CLOSED
            });
            this.dispatchFilterBuilderVisibleChangedEvent((_a = this.builderDestroySource) !== null && _a !== void 0 ? _a : 'ui', false);
            this.builderDestroySource = undefined;
        });
    }
    dispatchFilterBuilderVisibleChangedEvent(source, visible) {
        const event = {
            type: Events.EVENT_ADVANCED_FILTER_BUILDER_VISIBLE_CHANGED,
            source,
            visible
        };
        this.eventService.dispatchEvent(event);
    }
    getBuilderDialogSize() {
        var _a, _b;
        const minWidth = (_b = (_a = this.gridOptionsService.get('advancedFilterBuilderParams')) === null || _a === void 0 ? void 0 : _a.minWidth) !== null && _b !== void 0 ? _b : 500;
        const popupParent = this.popupService.getPopupParent();
        const maxWidth = Math.round(_.getAbsoluteWidth(popupParent)) - 2; // assume 1 pixel border
        const maxHeight = Math.round(_.getAbsoluteHeight(popupParent) * 0.75) - 2;
        const width = Math.min(Math.max(600, minWidth), maxWidth);
        const height = Math.min(600, maxHeight);
        return { width, height, minWidth };
    }
    onEnabledChanged(enabled) {
        this.enabled = enabled;
        this.updateComps();
    }
    updateComps() {
        this.setAdvancedFilterComp();
        this.setHeaderCompEnabled();
        this.eventService.dispatchEvent({
            type: Events.EVENT_HEADER_HEIGHT_CHANGED
        });
    }
    setAdvancedFilterComp() {
        this.destroyAdvancedFilterComp();
        if (!this.enabled) {
            return;
        }
        const advancedFilterParent = this.gridOptionsService.get('advancedFilterParent');
        this.hasAdvancedFilterParent = !!advancedFilterParent;
        if (advancedFilterParent) {
            // unmanaged as can be recreated
            const eAdvancedFilterComp = this.createBean(new AdvancedFilterComp());
            const eAdvancedFilterCompGui = eAdvancedFilterComp.getGui();
            const { allThemes } = this.environment.getTheme();
            if (allThemes.length) {
                eAdvancedFilterCompGui.classList.add(...allThemes);
            }
            eAdvancedFilterCompGui.classList.add(this.gridOptionsService.get('enableRtl') ? 'zing-rtl' : 'zing-ltr');
            advancedFilterParent.appendChild(eAdvancedFilterCompGui);
            this.eFilterComp = eAdvancedFilterComp;
        }
    }
    setHeaderCompEnabled() {
        var _a;
        (_a = this.eHeaderComp) === null || _a === void 0 ? void 0 : _a.setEnabled(this.enabled && !this.hasAdvancedFilterParent);
    }
    destroyAdvancedFilterComp() {
        if (this.eFilterComp) {
            _.removeFromParent(this.eFilterComp.getGui());
            this.destroyBean(this.eFilterComp);
        }
    }
}
AdvancedFilterCtrl.EVENT_BUILDER_CLOSED = 'advancedFilterBuilderClosed';
__decorate([
    Autowired('focusService')
], AdvancedFilterCtrl.prototype, "focusService", void 0);
__decorate([
    Autowired('ctrlsService')
], AdvancedFilterCtrl.prototype, "ctrlsService", void 0);
__decorate([
    Autowired('popupService')
], AdvancedFilterCtrl.prototype, "popupService", void 0);
__decorate([
    Autowired('advancedFilterExpressionService')
], AdvancedFilterCtrl.prototype, "advancedFilterExpressionService", void 0);
__decorate([
    PostConstruct
], AdvancedFilterCtrl.prototype, "postConstruct", null);
//# sourceMappingURL=advancedFilterCtrl.js.map