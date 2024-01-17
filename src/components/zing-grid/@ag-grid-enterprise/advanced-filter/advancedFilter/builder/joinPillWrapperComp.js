var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component } from "@/components/zing-grid/@ag-grid-community/core/main.js";
export class JoinPillWrapperComp extends Component {
    constructor() {
        super(/* html */ `
            <div class="ag-advanced-filter-builder-item-condition" role="presentation"></div>
        `);
    }
    init(params) {
        const { item, createPill } = params;
        const filterModel = item.filterModel;
        this.filterModel = filterModel;
        this.ePill = createPill({
            key: filterModel.type,
            displayValue: this.advancedFilterExpressionService.parseJoinOperator(filterModel),
            cssClass: 'ag-advanced-filter-builder-join-pill',
            isSelect: true,
            getEditorParams: () => ({ values: this.advancedFilterExpressionService.getJoinOperatorAutocompleteEntries() }),
            update: (key) => filterModel.type = key,
            pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderJoinSelectField',
            pickerAriaLabelValue: 'Advanced Filter Builder Join Operator Select Field',
            ariaLabel: this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderJoinOperator')
        });
        this.getGui().appendChild(this.ePill.getGui());
        this.addDestroyFunc(() => this.destroyBean(this.ePill));
    }
    getDragName() {
        return this.advancedFilterExpressionService.parseJoinOperator(this.filterModel);
    }
    getAriaLabel() {
        return `${this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderGroupItem')} ${this.getDragName()}`;
    }
    getValidationMessage() {
        return null;
    }
    getFocusableElement() {
        return this.ePill.getFocusableElement();
    }
}
__decorate([
    Autowired('advancedFilterExpressionService')
], JoinPillWrapperComp.prototype, "advancedFilterExpressionService", void 0);
//# sourceMappingURL=joinPillWrapperComp.js.map