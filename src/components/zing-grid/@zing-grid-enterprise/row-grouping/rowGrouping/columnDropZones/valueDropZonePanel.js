var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, DragAndDropService, Events, PostConstruct } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { BaseDropZonePanel } from "./baseDropZonePanel";
export class ValuesDropZonePanel extends BaseDropZonePanel {
  constructor(horizontal) {
    super(horizontal, 'aggregation');
  }
  passBeansUp() {
    super.setBeans({
      gridOptionsService: this.gridOptionsService,
      eventService: this.eventService,
      context: this.getContext(),
      loggerFactory: this.loggerFactory,
      dragAndDropService: this.dragAndDropService
    });
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const emptyMessage = localeTextFunc('valueColumnsEmptyMessage', 'Drag here to aggregate');
    const title = localeTextFunc('values', 'Values');
    super.init({
      dragAndDropIcon: DragAndDropService.ICON_AGGREGATE,
      icon: _.createIconNoSpan('valuePanel', this.gridOptionsService, null),
      emptyMessage: emptyMessage,
      title: title
    });
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VALUE_CHANGED, this.refreshGui.bind(this));
  }
  getAriaLabel() {
    const translate = this.localeService.getLocaleTextFunc();
    const label = translate('ariaValuesDropZonePanelLabel', 'Values');
    return label;
  }
  getTooltipParams() {
    const res = super.getTooltipParams();
    res.location = 'valueColumnsList';
    return res;
  }
  getIconName() {
    return this.isPotentialDndColumns() ? DragAndDropService.ICON_AGGREGATE : DragAndDropService.ICON_NOT_ALLOWED;
  }
  isColumnDroppable(column) {
    if (this.gridOptionsService.get('functionsReadOnly') || !column.isPrimary()) {
      return false;
    }
    return column.isAllowValue() && !column.isValueActive();
  }
  updateColumns(columns) {
    if (this.gridOptionsService.get('functionsPassive')) {
      const event = {
        type: Events.EVENT_COLUMN_VALUE_CHANGE_REQUEST,
        columns: columns
      };
      this.eventService.dispatchEvent(event);
    } else {
      this.columnModel.setValueColumns(columns, "toolPanelUi");
    }
  }
  getExistingColumns() {
    return this.columnModel.getValueColumns();
  }
}
__decorate([Autowired('columnModel')], ValuesDropZonePanel.prototype, "columnModel", void 0);
__decorate([Autowired('loggerFactory')], ValuesDropZonePanel.prototype, "loggerFactory", void 0);
__decorate([Autowired('dragAndDropService')], ValuesDropZonePanel.prototype, "dragAndDropService", void 0);
__decorate([PostConstruct], ValuesDropZonePanel.prototype, "passBeansUp", null);