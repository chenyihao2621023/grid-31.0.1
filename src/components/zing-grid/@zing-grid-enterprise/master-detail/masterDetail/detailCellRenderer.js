var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, RefSelector, _, ModuleRegistry, createGrid, ColumnApi } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { DetailCellRendererCtrl } from "./detailCellRendererCtrl";
export class DetailCellRenderer extends Component {
  init(params) {
    this.params = params;
    this.selectAndSetTemplate();
    const compProxy = {
      addOrRemoveCssClass: (cssClassName, on) => this.addOrRemoveCssClass(cssClassName, on),
      addOrRemoveDetailGridCssClass: (cssClassName, on) => this.eDetailGrid.classList.toggle(cssClassName, on),
      setDetailGrid: gridOptions => this.setDetailGrid(gridOptions),
      setRowData: rowData => this.setRowData(rowData),
      getGui: () => this.eDetailGrid
    };
    this.ctrl = this.createManagedBean(new DetailCellRendererCtrl());
    this.ctrl.init(compProxy, params);
  }
  refresh() {
    return this.ctrl && this.ctrl.refresh();
  }
  destroy() {
    super.destroy();
  }
  selectAndSetTemplate() {
    if (this.params.pinned) {
      this.setTemplate('<div class="zing-details-row"></div>');
      return;
    }
    const setDefaultTemplate = () => {
      this.setTemplate(DetailCellRenderer.TEMPLATE);
    };
    if (_.missing(this.params.template)) {
      setDefaultTemplate();
    } else {
      if (typeof this.params.template === 'string') {
        this.setTemplate(this.params.template);
      } else if (typeof this.params.template === 'function') {
        const templateFunc = this.params.template;
        const template = templateFunc(this.params);
        this.setTemplate(template);
      } else {
        console.warn('ZING Grid: detailCellRendererParams.template should be function or string');
        setDefaultTemplate();
      }
    }
    if (this.eDetailGrid == null) {
      console.warn('ZING Grid: reference to eDetailGrid was missing from the details template. ' + 'Please add ref="eDetailGrid" to the template.');
    }
  }
  setDetailGrid(gridOptions) {
    if (!this.eDetailGrid) {
      return;
    }
    const zingGridReact = this.context.getBean('zingGridReact');
    const zingGridReactCloned = zingGridReact ? _.cloneObject(ZingGridReact) : undefined;
    const frameworkComponentWrapper = this.context.getBean('frameworkComponentWrapper');
    const frameworkOverrides = this.getFrameworkOverrides();
    const api = createGrid(this.eDetailGrid, gridOptions, {
      frameworkOverrides,
      providedBeanInstances: {
        zingGridReact: zingGridReactCloned,
        frameworkComponentWrapper: frameworkComponentWrapper
      },
      modules: ModuleRegistry.__getGridRegisteredModules(this.params.api.getGridId())
    });
    this.detailApi = api;
    this.ctrl.registerDetailWithMaster(api, new ColumnApi(api));
    this.addDestroyFunc(() => {
      api === null || api === void 0 ? void 0 : api.destroy();
    });
  }
  setRowData(rowData) {
    this.detailApi && this.detailApi.setGridOption('rowData', rowData);
  }
}
DetailCellRenderer.TEMPLATE = `<div class="zing-details-row" role="gridcell">
            <div ref="eDetailGrid" class="zing-details-grid" role="presentation"></div>
        </div>`;
__decorate([RefSelector('eDetailGrid')], DetailCellRenderer.prototype, "eDetailGrid", void 0);