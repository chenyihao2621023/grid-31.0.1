var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, Events, PostConstruct, RefSelector, TooltipFeature, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { AddDropdownComp } from "./addDropdownComp";
import { AdvancedFilterBuilderItemNavigationFeature } from "./advancedFilterBuilderItemNavigationFeature";
import { getAdvancedFilterBuilderAddButtonParams } from "./advancedFilterBuilderUtils";
import { AdvancedFilterBuilderEvents } from "./iAdvancedFilterBuilder";
export class AdvancedFilterBuilderItemAddComp extends Component {
  constructor(item, focusWrapper) {
    super(`
            <div class="zing-advanced-filter-builder-item-wrapper" role="presentation">
                <div ref="eItem" class="zing-advanced-filter-builder-item" role="presentation">
                    <div class="zing-advanced-filter-builder-item-tree-lines" aria-hidden="true">
                        <div class="zing-advanced-filter-builder-item-tree-line-vertical-top zing-advanced-filter-builder-item-tree-line-horizontal"></div>
                    </div>
                </div>
            </div>
        `);
    this.item = item;
    this.focusWrapper = focusWrapper;
  }
  postConstruct() {
    var _a;
    _.setAriaLevel(this.focusWrapper, 2);
    const addButtonParams = getAdvancedFilterBuilderAddButtonParams(key => this.advancedFilterExpressionService.translate(key), (_a = this.gridOptionsService.get('advancedFilterBuilderParams')) === null || _a === void 0 ? void 0 : _a.addSelectWidth);
    const eAddButton = this.createManagedBean(new AddDropdownComp(addButtonParams));
    this.addManagedListener(eAddButton, Events.EVENT_FIELD_PICKER_VALUE_SELECTED, ({
      value
    }) => {
      this.dispatchEvent({
        type: AdvancedFilterBuilderEvents.EVENT_ADDED,
        item: this.item,
        isJoin: value.key === 'join'
      });
    });
    this.eItem.appendChild(eAddButton.getGui());
    const tooltipFeature = this.createManagedBean(new TooltipFeature({
      getGui: () => eAddButton.getGui(),
      getLocation: () => 'advancedFilter',
      getTooltipValue: () => this.advancedFilterExpressionService.translate('advancedFilterBuilderAddButtonTooltip')
    }, this.beans));
    tooltipFeature.setComp(eAddButton.getGui());
    this.createManagedBean(new AdvancedFilterBuilderItemNavigationFeature(this.getGui(), this.focusWrapper, eAddButton));
    _.setAriaLabel(this.focusWrapper, this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderItem', [this.advancedFilterExpressionService.translate('advancedFilterBuilderAddButtonTooltip'), `${this.item.level + 1}`]));
  }
  afterAdd() {}
}
__decorate([Autowired('beans')], AdvancedFilterBuilderItemAddComp.prototype, "beans", void 0);
__decorate([Autowired('advancedFilterExpressionService')], AdvancedFilterBuilderItemAddComp.prototype, "advancedFilterExpressionService", void 0);
__decorate([RefSelector('eItem')], AdvancedFilterBuilderItemAddComp.prototype, "eItem", void 0);
__decorate([PostConstruct], AdvancedFilterBuilderItemAddComp.prototype, "postConstruct", null);