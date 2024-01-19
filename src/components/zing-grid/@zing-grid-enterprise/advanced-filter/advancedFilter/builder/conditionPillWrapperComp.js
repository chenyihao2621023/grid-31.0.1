var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { AdvancedFilterBuilderEvents } from "./iAdvancedFilterBuilder";
export class ConditionPillWrapperComp extends Component {
    constructor() {
        super(/* html */ `
            <div class="zing-advanced-filter-builder-item-condition" role="presentation"></div>
        `);
        this.validationMessage = null;
    }
    init(params) {
        const { item, createPill } = params;
        this.item = item;
        this.createPill = createPill;
        this.filterModel = item.filterModel;
        this.setupColumnCondition(this.filterModel);
        this.validate();
        this.addDestroyFunc(() => this.destroyBeans([this.eColumnPill, this.eOperatorPill, this.eOperandPill]));
    }
    getDragName() {
        return this.filterModel.colId
            ? this.advancedFilterExpressionService.parseColumnFilterModel(this.filterModel)
            : this.getDefaultColumnDisplayValue();
    }
    getAriaLabel() {
        return `${this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderFilterItem')} ${this.getDragName()}`;
    }
    getValidationMessage() {
        return this.validationMessage;
    }
    getFocusableElement() {
        return this.eColumnPill.getFocusableElement();
    }
    setupColumnCondition(filterModel) {
        var _a;
        const columnDetails = this.advancedFilterExpressionService.getColumnDetails(filterModel.colId);
        this.baseCellDataType = columnDetails.baseCellDataType;
        this.column = columnDetails.column;
        this.numOperands = this.getNumOperands(this.getOperatorKey());
        this.eColumnPill = this.createPill({
            key: this.getColumnKey(),
            displayValue: (_a = this.getColumnDisplayValue()) !== null && _a !== void 0 ? _a : this.getDefaultColumnDisplayValue(),
            cssClass: 'zing-advanced-filter-builder-column-pill',
            isSelect: true,
            getEditorParams: () => ({ values: this.advancedFilterExpressionService.getColumnAutocompleteEntries() }),
            update: (key) => this.setColumnKey(key),
            pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderColumnSelectField',
            pickerAriaLabelValue: 'Advanced Filter Builder Column Select Field',
            ariaLabel: this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderColumn')
        });
        this.getGui().appendChild(this.eColumnPill.getGui());
        if (_.exists(this.getColumnKey())) {
            this.createOperatorPill();
            if (this.hasOperand()) {
                this.createOperandPill();
            }
        }
    }
    createOperatorPill() {
        var _a;
        this.eOperatorPill = this.createPill({
            key: this.getOperatorKey(),
            displayValue: (_a = this.getOperatorDisplayValue()) !== null && _a !== void 0 ? _a : this.getDefaultOptionSelectValue(),
            cssClass: 'zing-advanced-filter-builder-option-pill',
            isSelect: true,
            getEditorParams: () => ({ values: this.getOperatorAutocompleteEntries() }),
            update: (key) => this.setOperatorKey(key),
            pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderOptionSelectField',
            pickerAriaLabelValue: 'Advanced Filter Builder Option Select Field',
            ariaLabel: this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderOption')
        });
        this.eColumnPill.getGui().insertAdjacentElement('afterend', this.eOperatorPill.getGui());
    }
    createOperandPill() {
        var _a;
        const key = (_a = this.getOperandDisplayValue()) !== null && _a !== void 0 ? _a : '';
        this.eOperandPill = this.createPill({
            key,
            displayValue: key,
            baseCellDataType: this.baseCellDataType,
            cssClass: 'zing-advanced-filter-builder-value-pill',
            isSelect: false,
            update: (key) => this.setOperand(key),
            ariaLabel: this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderValue')
        });
        this.getGui().appendChild(this.eOperandPill.getGui());
    }
    getColumnKey() {
        return this.filterModel.colId;
    }
    getColumnDisplayValue() {
        return this.advancedFilterExpressionService.getColumnDisplayValue(this.filterModel);
    }
    getOperatorKey() {
        return this.filterModel.type;
    }
    getOperatorDisplayValue() {
        return this.advancedFilterExpressionService.getOperatorDisplayValue(this.filterModel);
    }
    getOperandDisplayValue() {
        return this.advancedFilterExpressionService.getOperandDisplayValue(this.filterModel, true);
    }
    hasOperand() {
        return this.numOperands > 0;
    }
    getOperatorAutocompleteEntries() {
        return this.column
            ? this.advancedFilterExpressionService.getOperatorAutocompleteEntries(this.column, this.baseCellDataType)
            : [];
    }
    setColumnKey(colId) {
        if (!this.eOperatorPill) {
            this.createOperatorPill();
        }
        const newColumnDetails = this.advancedFilterExpressionService.getColumnDetails(colId);
        this.column = newColumnDetails.column;
        const newBaseCellDataType = newColumnDetails.baseCellDataType;
        if (this.baseCellDataType !== newBaseCellDataType) {
            this.baseCellDataType = newBaseCellDataType;
            this.setOperatorKey(undefined);
            if (this.eOperatorPill) {
                _.removeFromParent(this.eOperatorPill.getGui());
                this.destroyBean(this.eOperatorPill);
                this.createOperatorPill();
            }
            this.validate();
        }
        this.filterModel.colId = colId;
        this.filterModel.filterType = this.baseCellDataType;
    }
    setOperatorKey(operator) {
        const newNumOperands = this.getNumOperands(operator);
        if (newNumOperands !== this.numOperands) {
            this.numOperands = newNumOperands;
            if (newNumOperands === 0) {
                this.destroyOperandPill();
            }
            else {
                this.createOperandPill();
                if (this.baseCellDataType !== 'number') {
                    this.setOperand('');
                }
            }
        }
        this.filterModel.type = operator;
        this.validate();
    }
    setOperand(operand) {
        var _a;
        let parsedOperand = operand;
        if (this.column) {
            parsedOperand = (_a = this.advancedFilterExpressionService.getOperandModelValue(operand, this.baseCellDataType, this.column)) !== null && _a !== void 0 ? _a : '';
        }
        this.filterModel.filter = parsedOperand;
        this.validate();
    }
    getNumOperands(operator) {
        var _a, _b;
        return (_b = (_a = this.advancedFilterExpressionService.getExpressionOperator(this.baseCellDataType, operator)) === null || _a === void 0 ? void 0 : _a.numOperands) !== null && _b !== void 0 ? _b : 0;
    }
    destroyOperandPill() {
        delete this.filterModel.filter;
        this.getGui().removeChild(this.eOperandPill.getGui());
        this.destroyBean(this.eOperandPill);
        this.eOperandPill = undefined;
    }
    validate() {
        let validationMessage = null;
        if (!_.exists(this.getColumnKey())) {
            validationMessage = this.advancedFilterExpressionService.translate('advancedFilterBuilderValidationSelectColumn');
        }
        else if (!_.exists(this.getOperatorKey())) {
            validationMessage = this.advancedFilterExpressionService.translate('advancedFilterBuilderValidationSelectOption');
        }
        else if (this.numOperands > 0 && !_.exists(this.getOperandDisplayValue())) {
            validationMessage = this.advancedFilterExpressionService.translate('advancedFilterBuilderValidationEnterValue');
        }
        this.item.valid = !validationMessage;
        if (validationMessage !== this.validationMessage) {
            this.validationMessage = validationMessage;
            this.dispatchEvent({
                type: AdvancedFilterBuilderEvents.EVENT_VALID_CHANGED
            });
        }
    }
    getDefaultColumnDisplayValue() {
        return this.advancedFilterExpressionService.translate('advancedFilterBuilderSelectColumn');
    }
    getDefaultOptionSelectValue() {
        return this.advancedFilterExpressionService.translate('advancedFilterBuilderSelectOption');
    }
}
__decorate([
    Autowired('advancedFilterExpressionService')
], ConditionPillWrapperComp.prototype, "advancedFilterExpressionService", void 0);
__decorate([
    Autowired('valueParserService')
], ConditionPillWrapperComp.prototype, "valueParserService", void 0);
//# sourceMappingURL=conditionPillWrapperComp.js.map