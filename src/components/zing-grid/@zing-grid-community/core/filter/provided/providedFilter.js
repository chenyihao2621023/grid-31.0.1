var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, PostConstruct } from '../../context/context';
import { clearElement, loadTemplate, removeFromParent, setDisabled } from '../../utils/dom';
import { debounce } from '../../utils/function';
import { FILTER_LOCALE_TEXT } from '../filterLocaleText';
import { ManagedFocusFeature } from '../../widgets/managedFocusFeature';
import { convertToSet } from '../../utils/set';
import { Component } from '../../widgets/component';
import { RefSelector } from '../../widgets/componentAnnotations';
import { PositionableFeature } from '../../rendering/features/positionableFeature';
/**
 * Contains common logic to all provided filters (apply button, clear button, etc).
 * All the filters that come with AG Grid extend this class. User filters do not
 * extend this class.
 *
 * @param M type of filter-model managed by the concrete sub-class that extends this type
 * @param V type of value managed by the concrete sub-class that extends this type
 */
export class ProvidedFilter extends Component {
    constructor(filterNameKey) {
        super();
        this.filterNameKey = filterNameKey;
        this.applyActive = false;
        this.hidePopup = null;
        this.debouncePending = false;
        // after the user hits 'apply' the model gets copied to here. this is then the model that we use for
        // all filtering. so if user changes UI but doesn't hit apply, then the UI will be out of sync with this model.
        // this is what we want, as the UI should only become the 'active' filter once it's applied. when apply is
        // inactive, this model will be in sync (following the debounce ms). if the UI is not a valid filter
        // (eg the value is missing so nothing to filter on, or for set filter all checkboxes are checked so filter
        // not active) then this appliedModel will be null/undefined.
        this.appliedModel = null;
        this.buttonListeners = [];
    }
    postConstruct() {
        this.resetTemplate(); // do this first to create the DOM
        this.createManagedBean(new ManagedFocusFeature(this.getFocusableElement(), {
            handleKeyDown: this.handleKeyDown.bind(this)
        }));
        this.positionableFeature = new PositionableFeature(this.getPositionableElement(), {
            forcePopupParentAsOffsetParent: true
        });
        this.createBean(this.positionableFeature);
    }
    // override
    handleKeyDown(e) { }
    getFilterTitle() {
        return this.translate(this.filterNameKey);
    }
    isFilterActive() {
        // filter is active if we have a valid applied model
        return !!this.appliedModel;
    }
    resetTemplate(paramsMap) {
        let eGui = this.getGui();
        if (eGui) {
            eGui.removeEventListener('submit', this.onFormSubmit);
        }
        const templateString = /* html */ `
            <form class="ag-filter-wrapper">
                <div class="ag-filter-body-wrapper ag-${this.getCssIdentifier()}-body-wrapper" ref="eFilterBody">
                    ${this.createBodyTemplate()}
                </div>
            </form>`;
        this.setTemplate(templateString, paramsMap);
        eGui = this.getGui();
        if (eGui) {
            eGui.addEventListener('submit', this.onFormSubmit);
        }
    }
    isReadOnly() {
        return !!this.providedFilterParams.readOnly;
    }
    init(params) {
        this.setParams(params);
        this.resetUiToDefaults(true).then(() => {
            this.updateUiVisibility();
            this.setupOnBtApplyDebounce();
        });
    }
    setParams(params) {
        this.providedFilterParams = params;
        this.applyActive = ProvidedFilter.isUseApplyButton(params);
        this.resetButtonsPanel();
    }
    updateParams(params) {
        this.providedFilterParams = params;
        this.applyActive = ProvidedFilter.isUseApplyButton(params);
        this.resetUiToActiveModel(this.getModel(), () => {
            this.updateUiVisibility();
            this.setupOnBtApplyDebounce();
        });
    }
    resetButtonsPanel() {
        const { buttons } = this.providedFilterParams;
        const hasButtons = buttons && buttons.length > 0 && !this.isReadOnly();
        if (!this.eButtonsPanel) {
            // Only create the buttons panel if we need to
            if (hasButtons) {
                this.eButtonsPanel = document.createElement('div');
                this.eButtonsPanel.classList.add('ag-filter-apply-panel');
            }
        }
        else {
            // Always empty the buttons panel before adding new buttons
            clearElement(this.eButtonsPanel);
            this.buttonListeners.forEach(destroyFunc => destroyFunc === null || destroyFunc === void 0 ? void 0 : destroyFunc());
            this.buttonListeners = [];
        }
        if (!hasButtons) {
            // The case when we need to hide the buttons panel because there are no buttons
            if (this.eButtonsPanel) {
                removeFromParent(this.eButtonsPanel);
            }
            return;
        }
        // At this point we know we have a buttons and a buttons panel has been created.
        // Instead of appending each button to the DOM individually, we create a fragment and append that
        // to the DOM once. This is much faster than appending each button individually.
        const fragment = document.createDocumentFragment();
        const addButton = (type) => {
            let text;
            let clickListener;
            switch (type) {
                case 'apply':
                    text = this.translate('applyFilter');
                    clickListener = (e) => this.onBtApply(false, false, e);
                    break;
                case 'clear':
                    text = this.translate('clearFilter');
                    clickListener = () => this.onBtClear();
                    break;
                case 'reset':
                    text = this.translate('resetFilter');
                    clickListener = () => this.onBtReset();
                    break;
                case 'cancel':
                    text = this.translate('cancelFilter');
                    clickListener = (e) => { this.onBtCancel(e); };
                    break;
                default:
                    console.warn('AG Grid: Unknown button type specified');
                    return;
            }
            const buttonType = type === 'apply' ? 'submit' : 'button';
            const button = loadTemplate(
            /* html */
            `<button
                    type="${buttonType}"
                    ref="${type}FilterButton"
                    class="ag-button ag-standard-button ag-filter-apply-panel-button"
                >${text}
                </button>`);
            this.buttonListeners.push(this.addManagedListener(button, 'click', clickListener));
            fragment.append(button);
        };
        convertToSet(buttons).forEach(type => addButton(type));
        this.eButtonsPanel.append(fragment);
        this.getGui().appendChild(this.eButtonsPanel);
    }
    // subclasses can override this to provide alternative debounce defaults
    getDefaultDebounceMs() {
        return 0;
    }
    setupOnBtApplyDebounce() {
        const debounceMs = ProvidedFilter.getDebounceMs(this.providedFilterParams, this.getDefaultDebounceMs());
        const debounceFunc = debounce(this.checkApplyDebounce.bind(this), debounceMs);
        this.onBtApplyDebounce = () => {
            this.debouncePending = true;
            debounceFunc();
        };
    }
    checkApplyDebounce() {
        if (this.debouncePending) {
            // May already have been applied, so don't apply again (e.g. closing filter before debounce timeout)
            this.debouncePending = false;
            this.onBtApply();
        }
    }
    getModel() {
        return this.appliedModel ? this.appliedModel : null;
    }
    setModel(model) {
        const promise = model != null ? this.setModelIntoUi(model) : this.resetUiToDefaults();
        return promise.then(() => {
            this.updateUiVisibility();
            // we set the model from the GUI, rather than the provided model,
            // so the model is consistent, e.g. handling of null/undefined will be the same,
            // or if model is case-insensitive, then casing is removed.
            this.applyModel('api');
        });
    }
    onBtCancel(e) {
        this.resetUiToActiveModel(this.getModel(), () => {
            this.handleCancelEnd(e);
        });
    }
    handleCancelEnd(e) {
        if (this.providedFilterParams.closeOnApply) {
            this.close(e);
        }
    }
    resetUiToActiveModel(currentModel, afterUiUpdatedFunc) {
        const afterAppliedFunc = () => {
            this.onUiChanged(false, 'prevent');
            afterUiUpdatedFunc === null || afterUiUpdatedFunc === void 0 ? void 0 : afterUiUpdatedFunc();
        };
        if (currentModel != null) {
            this.setModelIntoUi(currentModel).then(afterAppliedFunc);
        }
        else {
            this.resetUiToDefaults().then(afterAppliedFunc);
        }
    }
    onBtClear() {
        this.resetUiToDefaults().then(() => this.onUiChanged());
    }
    onBtReset() {
        this.onBtClear();
        this.onBtApply();
    }
    /**
     * Applies changes made in the UI to the filter, and returns true if the model has changed.
     */
    applyModel(source = 'api') {
        const newModel = this.getModelFromUi();
        if (!this.isModelValid(newModel)) {
            return false;
        }
        const previousModel = this.appliedModel;
        this.appliedModel = newModel;
        // models can be same if user pasted same content into text field, or maybe just changed the case
        // and it's a case insensitive filter
        return !this.areModelsEqual(previousModel, newModel);
    }
    isModelValid(model) {
        return true;
    }
    onFormSubmit(e) {
        e.preventDefault();
    }
    onBtApply(afterFloatingFilter = false, afterDataChange = false, e) {
        // Prevent form submission
        if (e) {
            e.preventDefault();
        }
        if (this.applyModel(afterDataChange ? 'rowDataUpdated' : 'ui')) {
            // the floating filter uses 'afterFloatingFilter' info, so it doesn't refresh after filter changed if change
            // came from floating filter
            const source = 'columnFilter';
            this.providedFilterParams.filterChangedCallback({ afterFloatingFilter, afterDataChange, source });
        }
        const { closeOnApply } = this.providedFilterParams;
        // only close if an apply button is visible, otherwise we'd be closing every time a change was made!
        if (closeOnApply && this.applyActive && !afterFloatingFilter && !afterDataChange) {
            this.close(e);
        }
    }
    onNewRowsLoaded() {
    }
    close(e) {
        if (!this.hidePopup) {
            return;
        }
        const keyboardEvent = e;
        const key = keyboardEvent && keyboardEvent.key;
        let params;
        if (key === 'Enter' || key === 'Space') {
            params = { keyboardEvent };
        }
        this.hidePopup(params);
        this.hidePopup = null;
    }
    /**
     * By default, if the change came from a floating filter it will be applied immediately, otherwise if there is no
     * apply button it will be applied after a debounce, otherwise it will not be applied at all. This behaviour can
     * be adjusted by using the apply parameter.
     */
    onUiChanged(fromFloatingFilter = false, apply) {
        this.updateUiVisibility();
        this.providedFilterParams.filterModifiedCallback();
        if (this.applyActive && !this.isReadOnly()) {
            const isValid = this.isModelValid(this.getModelFromUi());
            const applyFilterButton = this.getRefElement('applyFilterButton');
            if (applyFilterButton) {
                setDisabled(applyFilterButton, !isValid);
            }
        }
        if ((fromFloatingFilter && !apply) || apply === 'immediately') {
            this.onBtApply(fromFloatingFilter);
        }
        else if ((!this.applyActive && !apply) || apply === 'debounce') {
            this.onBtApplyDebounce();
        }
    }
    afterGuiAttached(params) {
        if (params) {
            this.hidePopup = params.hidePopup;
        }
        this.refreshFilterResizer(params === null || params === void 0 ? void 0 : params.container);
    }
    refreshFilterResizer(containerType) {
        // tool panel is scrollable, so don't need to size
        if (!this.positionableFeature || containerType === 'toolPanel') {
            return;
        }
        const isFloatingFilter = containerType === 'floatingFilter';
        const { positionableFeature, gridOptionsService } = this;
        if (isFloatingFilter) {
            positionableFeature.restoreLastSize();
            positionableFeature.setResizable(gridOptionsService.get('enableRtl')
                ? { bottom: true, bottomLeft: true, left: true }
                : { bottom: true, bottomRight: true, right: true });
        }
        else {
            this.positionableFeature.removeSizeFromEl();
            this.positionableFeature.setResizable(false);
        }
        this.positionableFeature.constrainSizeToAvailableHeight(true);
    }
    afterGuiDetached() {
        this.checkApplyDebounce();
        if (this.positionableFeature) {
            this.positionableFeature.constrainSizeToAvailableHeight(false);
        }
    }
    // static, as used by floating filter also
    static getDebounceMs(params, debounceDefault) {
        if (ProvidedFilter.isUseApplyButton(params)) {
            if (params.debounceMs != null) {
                console.warn('AG Grid: debounceMs is ignored when apply button is present');
            }
            return 0;
        }
        return params.debounceMs != null ? params.debounceMs : debounceDefault;
    }
    // static, as used by floating filter also
    static isUseApplyButton(params) {
        return !!params.buttons && params.buttons.indexOf('apply') >= 0;
    }
    refresh(newParams) {
        this.providedFilterParams = newParams;
        return true;
    }
    destroy() {
        const eGui = this.getGui();
        if (eGui) {
            eGui.removeEventListener('submit', this.onFormSubmit);
        }
        this.hidePopup = null;
        if (this.positionableFeature) {
            this.positionableFeature = this.destroyBean(this.positionableFeature);
        }
        super.destroy();
    }
    translate(key) {
        const translate = this.localeService.getLocaleTextFunc();
        return translate(key, FILTER_LOCALE_TEXT[key]);
    }
    getCellValue(rowNode) {
        return this.providedFilterParams.getValue(rowNode);
    }
    // override to control positionable feature
    getPositionableElement() {
        return this.eFilterBody;
    }
}
__decorate([
    Autowired('rowModel')
], ProvidedFilter.prototype, "rowModel", void 0);
__decorate([
    RefSelector('eFilterBody')
], ProvidedFilter.prototype, "eFilterBody", void 0);
__decorate([
    PostConstruct
], ProvidedFilter.prototype, "postConstruct", null);
//# sourceMappingURL=providedFilter.js.map