var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, Events, PreConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class PivotModePanel extends Component {
    createTemplate() {
        return  `<div class="zing-pivot-mode-panel">
                <zing-toggle-button ref="cbPivotMode" class="zing-pivot-mode-select"></zing-toggle-button>
            </div>`;
    }
    init() {
        this.setTemplate(this.createTemplate());
        this.cbPivotMode.setValue(this.columnModel.isPivotMode());
        const localeTextFunc = this.localeService.getLocaleTextFunc();
        this.cbPivotMode.setLabel(localeTextFunc('pivotMode', 'Pivot Mode'));
        this.addManagedListener(this.cbPivotMode, Events.EVENT_FIELD_VALUE_CHANGED, this.onBtPivotMode.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.onPivotModeChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, this.onPivotModeChanged.bind(this));
    }
    onBtPivotMode() {
        const newValue = !!this.cbPivotMode.getValue();
        if (newValue !== this.columnModel.isPivotMode()) {
            this.gridOptionsService.updateGridOptions({ options: { pivotMode: newValue }, source: 'toolPanelUi' });
            const { api } = this;
            if (api) {
                api.refreshHeader();
            }
        }
    }
    onPivotModeChanged() {
        const pivotModeActive = this.columnModel.isPivotMode();
        this.cbPivotMode.setValue(pivotModeActive);
    }
}
__decorate([
    Autowired('columnModel')
], PivotModePanel.prototype, "columnModel", void 0);
__decorate([
    Autowired('gridApi')
], PivotModePanel.prototype, "api", void 0);
__decorate([
    RefSelector('cbPivotMode')
], PivotModePanel.prototype, "cbPivotMode", void 0);
__decorate([
    PreConstruct
], PivotModePanel.prototype, "init", null);
