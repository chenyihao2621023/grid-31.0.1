var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ZingAutocomplete, Autowired, Component, PostConstruct, RefSelector, _ } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { AdvancedFilterCtrl } from './advancedFilterCtrl';
export class AdvancedFilterComp extends Component {
    constructor() {
        super( `
            <div class="zing-advanced-filter" role="presentation" tabindex="-1">
                <zing-autocomplete ref="eAutocomplete"></zing-autocomplete>
                <button class="zing-button zing-standard-button zing-advanced-filter-apply-button" ref="eApplyFilterButton"></button>
                <button class="zing-advanced-filter-builder-button" ref="eBuilderFilterButton">
                    <span ref="eBuilderFilterButtonIcon" aria-hidden="true"></span>
                    <span class="zing-advanced-filter-builder-button-label" ref="eBuilderFilterButtonLabel"></span>
                </button>
            </div>`);
        this.expressionParser = null;
        this.isApplyDisabled = true;
        this.builderOpen = false;
    }
    postConstruct() {
        this.eAutocomplete
            .setListGenerator((_value, position) => this.generateAutocompleteListParams(position))
            .setValidator(() => this.validateValue())
            .setForceLastSelection((lastSelection, searchString) => this.forceLastSelection(lastSelection, searchString))
            .setInputAriaLabel(this.advancedFilterExpressionService.translate('ariaAdvancedFilterInput'))
            .setListAriaLabel(this.advancedFilterExpressionService.translate('ariaLabelAdvancedFilterAutocomplete'));
        this.refresh();
        this.addManagedListener(this.eAutocomplete, ZingAutocomplete.EVENT_VALUE_CHANGED, ({ value }) => this.onValueChanged(value));
        this.addManagedListener(this.eAutocomplete, ZingAutocomplete.EVENT_VALUE_CONFIRMED, ({ isValid }) => this.onValueConfirmed(isValid));
        this.addManagedListener(this.eAutocomplete, ZingAutocomplete.EVENT_OPTION_SELECTED, ({ position, updateEntry, autocompleteType }) => this.onOptionSelected(position, updateEntry, autocompleteType));
        this.addManagedListener(this.eAutocomplete, ZingAutocomplete.EVENT_VALID_CHANGED, ({ isValid, validationMessage }) => this.onValidChanged(isValid, validationMessage));
        this.setupApplyButton();
        this.setupBuilderButton();
    }
    refresh() {
        const expression = this.advancedFilterService.getExpressionDisplayValue();
        this.eAutocomplete.setValue({ value: expression !== null && expression !== void 0 ? expression : '', position: expression === null || expression === void 0 ? void 0 : expression.length, updateListOnlyIfOpen: true });
    }
    setInputDisabled(disabled) {
        this.eAutocomplete.setInputDisabled(disabled);
        _.setDisabled(this.eApplyFilterButton, disabled || this.isApplyDisabled);
    }
    getTooltipParams() {
        const res = super.getTooltipParams();
        res.location = 'advancedFilter';
        return res;
    }
    setupApplyButton() {
        this.eApplyFilterButton.innerText = this.advancedFilterExpressionService.translate('advancedFilterApply');
        this.activateTabIndex([this.eApplyFilterButton]);
        this.addManagedListener(this.eApplyFilterButton, 'click', () => this.onValueConfirmed(this.eAutocomplete.isValid()));
        _.setDisabled(this.eApplyFilterButton, this.isApplyDisabled);
    }
    setupBuilderButton() {
        this.eBuilderFilterButtonIcon.appendChild(_.createIconNoSpan('advancedFilterBuilder', this.gridOptionsService));
        this.eBuilderFilterButtonLabel.innerText = this.advancedFilterExpressionService.translate('advancedFilterBuilder');
        this.activateTabIndex([this.eBuilderFilterButton]);
        this.addManagedListener(this.eBuilderFilterButton, 'click', () => this.openBuilder());
        this.addManagedListener(this.advancedFilterService.getCtrl(), AdvancedFilterCtrl.EVENT_BUILDER_CLOSED, () => this.closeBuilder());
    }
    onValueChanged(value) {
        var _a;
        value = _.makeNull(value);
        this.advancedFilterService.setExpressionDisplayValue(value);
        this.expressionParser = this.advancedFilterService.createExpressionParser(value);
        const updatedExpression = (_a = this.expressionParser) === null || _a === void 0 ? void 0 : _a.parseExpression();
        if (updatedExpression && updatedExpression !== value) {
            this.eAutocomplete.setValue({ value: updatedExpression, silent: true, restoreFocus: true });
        }
    }
    onValueConfirmed(isValid) {
        if (!isValid || this.isApplyDisabled) {
            return;
        }
        _.setDisabled(this.eApplyFilterButton, true);
        this.advancedFilterService.applyExpression();
        this.filterManager.onFilterChanged({ source: 'advancedFilter' });
    }
    onOptionSelected(position, updateEntry, type) {
        const { updatedValue, updatedPosition, hideAutocomplete } = this.updateExpression(position, updateEntry, type);
        this.eAutocomplete.setValue({
            value: updatedValue,
            position: updatedPosition,
            updateListOnlyIfOpen: hideAutocomplete,
            restoreFocus: true
        });
    }
    validateValue() {
        var _a, _b, _c;
        return ((_a = this.expressionParser) === null || _a === void 0 ? void 0 : _a.isValid()) ? null : ((_c = (_b = this.expressionParser) === null || _b === void 0 ? void 0 : _b.getValidationMessage()) !== null && _c !== void 0 ? _c : null);
    }
    onValidChanged(isValid, validationMessage) {
        this.isApplyDisabled = !isValid || this.advancedFilterService.isCurrentExpressionApplied();
        _.setDisabled(this.eApplyFilterButton, this.isApplyDisabled);
        this.setTooltip(validationMessage, 1000);
    }
    generateAutocompleteListParams(position) {
        return this.expressionParser
            ? this.expressionParser.getAutocompleteListParams(position)
            : this.advancedFilterExpressionService.getDefaultAutocompleteListParams('');
    }
    updateExpression(position, updateEntry, type) {
        var _a, _b;
        this.advancedFilterExpressionService.updateAutocompleteCache(updateEntry, type);
        return (_b = (_a = this.expressionParser) === null || _a === void 0 ? void 0 : _a.updateExpression(position, updateEntry, type)) !== null && _b !== void 0 ? _b : this.advancedFilterService.getDefaultExpression(updateEntry);
    }
    forceLastSelection({ key, displayValue }, searchString) {
        return !!searchString.toLocaleLowerCase().match(`^${(displayValue !== null && displayValue !== void 0 ? displayValue : key).toLocaleLowerCase()}\\s*$`);
    }
    openBuilder() {
        if (this.builderOpen) {
            return;
        }
        this.builderOpen = true;
        _.setDisabled(this.eBuilderFilterButton, true);
        this.advancedFilterService.getCtrl().toggleFilterBuilder('ui');
    }
    closeBuilder() {
        if (!this.builderOpen) {
            return;
        }
        this.builderOpen = false;
        _.setDisabled(this.eBuilderFilterButton, false);
        this.eBuilderFilterButton.focus();
    }
}
__decorate([
    RefSelector('eAutocomplete')
], AdvancedFilterComp.prototype, "eAutocomplete", void 0);
__decorate([
    RefSelector('eApplyFilterButton')
], AdvancedFilterComp.prototype, "eApplyFilterButton", void 0);
__decorate([
    RefSelector('eBuilderFilterButton')
], AdvancedFilterComp.prototype, "eBuilderFilterButton", void 0);
__decorate([
    RefSelector('eBuilderFilterButtonIcon')
], AdvancedFilterComp.prototype, "eBuilderFilterButtonIcon", void 0);
__decorate([
    RefSelector('eBuilderFilterButtonLabel')
], AdvancedFilterComp.prototype, "eBuilderFilterButtonLabel", void 0);
__decorate([
    Autowired('advancedFilterService')
], AdvancedFilterComp.prototype, "advancedFilterService", void 0);
__decorate([
    Autowired('advancedFilterExpressionService')
], AdvancedFilterComp.prototype, "advancedFilterExpressionService", void 0);
__decorate([
    Autowired('filterManager')
], AdvancedFilterComp.prototype, "filterManager", void 0);
__decorate([
    PostConstruct
], AdvancedFilterComp.prototype, "postConstruct", null);
