import { BeanStub } from "../../context/beanStub";
export class CellCustomStyleFeature extends BeanStub {
  constructor(ctrl, beans) {
    super();
    this.staticClasses = [];
    this.cellCtrl = ctrl;
    this.beans = beans;
    this.column = ctrl.getColumn();
    this.rowNode = ctrl.getRowNode();
  }
  setComp(comp) {
    this.cellComp = comp;
    this.applyUserStyles();
    this.applyCellClassRules();
    this.applyClassesFromColDef();
  }
  applyCellClassRules() {
    const colDef = this.column.getColDef();
    const {
      cellClassRules
    } = colDef;
    const cellClassParams = {
      value: this.cellCtrl.getValue(),
      data: this.rowNode.data,
      node: this.rowNode,
      colDef: colDef,
      column: this.column,
      rowIndex: this.rowNode.rowIndex,
      api: this.beans.gridOptionsService.api,
      columnApi: this.beans.gridOptionsService.columnApi,
      context: this.beans.gridOptionsService.context
    };
    this.beans.stylingService.processClassRules(cellClassRules === this.cellClassRules ? undefined : this.cellClassRules, cellClassRules, cellClassParams, className => this.cellComp.addOrRemoveCssClass(className, true), className => this.cellComp.addOrRemoveCssClass(className, false));
    this.cellClassRules = cellClassRules;
  }
  applyUserStyles() {
    const colDef = this.column.getColDef();
    if (!colDef.cellStyle) {
      return;
    }
    let styles;
    if (typeof colDef.cellStyle === 'function') {
      const cellStyleParams = {
        column: this.column,
        value: this.cellCtrl.getValue(),
        colDef: colDef,
        data: this.rowNode.data,
        node: this.rowNode,
        rowIndex: this.rowNode.rowIndex,
        api: this.beans.gridOptionsService.api,
        columnApi: this.beans.gridOptionsService.columnApi,
        context: this.beans.gridOptionsService.context
      };
      const cellStyleFunc = colDef.cellStyle;
      styles = cellStyleFunc(cellStyleParams);
    } else {
      styles = colDef.cellStyle;
    }
    if (styles) {
      this.cellComp.setUserStyles(styles);
    }
  }
  applyClassesFromColDef() {
    const colDef = this.column.getColDef();
    const cellClassParams = {
      value: this.cellCtrl.getValue(),
      data: this.rowNode.data,
      node: this.rowNode,
      column: this.column,
      colDef: colDef,
      rowIndex: this.rowNode.rowIndex,
      api: this.beans.gridOptionsService.api,
      columnApi: this.beans.gridOptionsService.columnApi,
      context: this.beans.gridOptionsService.context
    };
    if (this.staticClasses.length) {
      this.staticClasses.forEach(className => this.cellComp.addOrRemoveCssClass(className, false));
    }
    this.staticClasses = this.beans.stylingService.getStaticCellClasses(colDef, cellClassParams);
    if (this.staticClasses.length) {
      this.staticClasses.forEach(className => this.cellComp.addOrRemoveCssClass(className, true));
    }
  }
  destroy() {
    super.destroy();
  }
}