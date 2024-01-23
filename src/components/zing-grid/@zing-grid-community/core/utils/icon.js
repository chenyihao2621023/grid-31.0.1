import { loadTemplate, isNodeOrElement } from './dom';
import { setAriaRole } from './aria';
export const iconNameClassMap = {
  columnGroupOpened: 'expanded',
  columnGroupClosed: 'contracted',
  columnSelectClosed: 'tree-closed',
  columnSelectOpen: 'tree-open',
  columnSelectIndeterminate: 'tree-indeterminate',
  columnMovePin: 'pin',
  columnMoveHide: 'eye-slash',
  columnMoveMove: 'arrows',
  columnMoveLeft: 'left',
  columnMoveRight: 'right',
  columnMoveGroup: 'group',
  columnMoveValue: 'aggregation',
  columnMovePivot: 'pivot',
  dropNotAllowed: 'not-allowed',
  groupContracted: 'tree-closed',
  groupExpanded: 'tree-open',
  setFilterGroupClosed: 'tree-closed',
  setFilterGroupOpen: 'tree-open',
  setFilterGroupIndeterminate: 'tree-indeterminate',
  chart: 'chart',
  close: 'cross',
  cancel: 'cancel',
  check: 'tick',
  first: 'first',
  previous: 'previous',
  next: 'next',
  last: 'last',
  linked: 'linked',
  unlinked: 'unlinked',
  colorPicker: 'color-picker',
  groupLoading: 'loading',
  menu: 'menu',
  filter: 'filter',
  columns: 'columns',
  maximize: 'maximize',
  minimize: 'minimize',
  menuPin: 'pin',
  menuValue: 'aggregation',
  menuAddRowGroup: 'group',
  menuRemoveRowGroup: 'group',
  clipboardCopy: 'copy',
  clipboardCut: 'cut',
  clipboardPaste: 'paste',
  pivotPanel: 'pivot',
  rowGroupPanel: 'group',
  valuePanel: 'aggregation',
  columnDrag: 'grip',
  rowDrag: 'grip',
  save: 'save',
  csvExport: 'csv',
  excelExport: 'excel',
  smallDown: 'small-down',
  smallLeft: 'small-left',
  smallRight: 'small-right',
  smallUp: 'small-up',
  sortAscending: 'asc',
  sortDescending: 'desc',
  sortUnSort: 'none',
  advancedFilterBuilder: 'group',
  advancedFilterBuilderDrag: 'grip',
  advancedFilterBuilderInvalid: 'not-allowed',
  advancedFilterBuilderMoveUp: 'up',
  advancedFilterBuilderMoveDown: 'down',
  advancedFilterBuilderAdd: 'plus',
  advancedFilterBuilderRemove: 'minus'
};
export function createIcon(iconName, gridOptionsService, column) {
  const iconContents = createIconNoSpan(iconName, gridOptionsService, column);
  if (iconContents) {
    const {
      className
    } = iconContents;
    if (typeof className === 'string' && className.indexOf('zing-icon') > -1 || typeof className === 'object' && className['zing-icon']) {
      return iconContents;
    }
  }
  const eResult = document.createElement('span');
  eResult.appendChild(iconContents);
  return eResult;
}
export function createIconNoSpan(iconName, gridOptionsService, column, forceCreate) {
  let userProvidedIcon = null;
  const icons = column && column.getColDef().icons;
  if (icons) {
    userProvidedIcon = icons[iconName];
  }
  if (gridOptionsService && !userProvidedIcon) {
    const optionsIcons = gridOptionsService.get('icons');
    if (optionsIcons) {
      userProvidedIcon = optionsIcons[iconName];
    }
  }
  if (userProvidedIcon) {
    let rendererResult;
    if (typeof userProvidedIcon === 'function') {
      rendererResult = userProvidedIcon();
    } else if (typeof userProvidedIcon === 'string') {
      rendererResult = userProvidedIcon;
    } else {
      throw new Error('icon from grid options needs to be a string or a function');
    }
    if (typeof rendererResult === 'string') {
      return loadTemplate(rendererResult);
    }
    if (isNodeOrElement(rendererResult)) {
      return rendererResult;
    }
    console.warn('ZING Grid: iconRenderer should return back a string or a dom object');
  } else {
    const span = document.createElement('span');
    let cssClass = iconNameClassMap[iconName];
    if (!cssClass) {
      if (!forceCreate) {
        console.warn(`ZING Grid: Did not find icon ${iconName}`);
        cssClass = '';
      } else {
        cssClass = iconName;
      }
    }
    span.setAttribute('class', `zing-icon zing-icon-${cssClass}`);
    span.setAttribute('unselectable', 'on');
    setAriaRole(span, 'presentation');
    return span;
  }
}