import { missing } from "../../utils/generic";
const CSS_FIRST_COLUMN = 'zing-column-first';
const CSS_LAST_COLUMN = 'zing-column-last';
export class CssClassApplier {
  static getHeaderClassesFromColDef(abstractColDef, gridOptionsService, column, columnGroup) {
    if (missing(abstractColDef)) {
      return [];
    }
    return this.getColumnClassesFromCollDef(abstractColDef.headerClass, abstractColDef, gridOptionsService, column, columnGroup);
  }
  static getToolPanelClassesFromColDef(abstractColDef, gridOptionsService, column, columnGroup) {
    if (missing(abstractColDef)) {
      return [];
    }
    return this.getColumnClassesFromCollDef(abstractColDef.toolPanelClass, abstractColDef, gridOptionsService, column, columnGroup);
  }
  static refreshFirstAndLastStyles(comp, column, columnModel) {
    comp.addOrRemoveCssClass(CSS_FIRST_COLUMN, columnModel.isColumnAtEdge(column, 'first'));
    comp.addOrRemoveCssClass(CSS_LAST_COLUMN, columnModel.isColumnAtEdge(column, 'last'));
  }
  static getClassParams(abstractColDef, gridOptionsService, column, columnGroup) {
    return {
      colDef: abstractColDef,
      column: column,
      columnGroup: columnGroup,
      api: gridOptionsService.api,
      columnApi: gridOptionsService.columnApi,
      context: gridOptionsService.context
    };
  }
  static getColumnClassesFromCollDef(classesOrFunc, abstractColDef, gridOptionsService, column, columnGroup) {
    if (missing(classesOrFunc)) {
      return [];
    }
    let classToUse;
    if (typeof classesOrFunc === 'function') {
      const params = this.getClassParams(abstractColDef, gridOptionsService, column, columnGroup);
      classToUse = classesOrFunc(params);
    } else {
      classToUse = classesOrFunc;
    }
    if (typeof classToUse === 'string') {
      return [classToUse];
    }
    if (Array.isArray(classToUse)) {
      return [...classToUse];
    }
    return [];
  }
}