var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
let AutoWidthCalculator = class AutoWidthCalculator extends BeanStub {
  postConstruct() {
    this.ctrlsService.whenReady(p => {
      this.centerRowContainerCtrl = p.centerRowContainerCtrl;
    });
  }
  getPreferredWidthForColumn(column, skipHeader) {
    const eHeaderCell = this.getHeaderCellForColumn(column);
    if (!eHeaderCell) {
      return -1;
    }
    const elements = this.rowRenderer.getAllCellsForColumn(column);
    if (!skipHeader) {
      elements.push(eHeaderCell);
    }
    return this.addElementsToContainerAndGetWidth(elements);
  }
  getPreferredWidthForColumnGroup(columnGroup) {
    const eHeaderCell = this.getHeaderCellForColumn(columnGroup);
    if (!eHeaderCell) {
      return -1;
    }
    return this.addElementsToContainerAndGetWidth([eHeaderCell]);
  }
  addElementsToContainerAndGetWidth(elements) {
    const eDummyContainer = document.createElement('form');
    eDummyContainer.style.position = 'fixed';
    const eBodyContainer = this.centerRowContainerCtrl.getContainerElement();
    elements.forEach(el => this.cloneItemIntoDummy(el, eDummyContainer));
    eBodyContainer.appendChild(eDummyContainer);
    const dummyContainerWidth = eDummyContainer.offsetWidth;
    eBodyContainer.removeChild(eDummyContainer);
    const autoSizePadding = this.getAutoSizePadding();
    return dummyContainerWidth + autoSizePadding;
  }
  getAutoSizePadding() {
    return this.gridOptionsService.get('autoSizePadding');
  }
  getHeaderCellForColumn(column) {
    let element = null;
    this.ctrlsService.getHeaderRowContainerCtrls().forEach(container => {
      const res = container.getHtmlElementForColumnHeader(column);
      if (res != null) {
        element = res;
      }
    });
    return element;
  }
  cloneItemIntoDummy(eCell, eDummyContainer) {
    const eCellClone = eCell.cloneNode(true);
    eCellClone.style.width = '';
    eCellClone.style.position = 'static';
    eCellClone.style.left = '';
    const eCloneParent = document.createElement('div');
    const eCloneParentClassList = eCloneParent.classList;
    const isHeader = ['zing-header-cell', 'zing-header-group-cell'].some(cls => eCellClone.classList.contains(cls));
    if (isHeader) {
      eCloneParentClassList.add('zing-header', 'zing-header-row');
      eCloneParent.style.position = 'static';
    } else {
      eCloneParentClassList.add('zing-row');
    }
    let pointer = eCell.parentElement;
    while (pointer) {
      const isRow = ['zing-header-row', 'zing-row'].some(cls => pointer.classList.contains(cls));
      if (isRow) {
        for (let i = 0; i < pointer.classList.length; i++) {
          const item = pointer.classList[i];
          if (item != 'zing-row-position-absolute') {
            eCloneParentClassList.add(item);
          }
        }
        break;
      }
      pointer = pointer.parentElement;
    }
    eCloneParent.appendChild(eCellClone);
    eDummyContainer.appendChild(eCloneParent);
  }
};
__decorate([Autowired('rowRenderer')], AutoWidthCalculator.prototype, "rowRenderer", void 0);
__decorate([Autowired('ctrlsService')], AutoWidthCalculator.prototype, "ctrlsService", void 0);
__decorate([Autowired('rowCssClassCalculator')], AutoWidthCalculator.prototype, "rowCssClassCalculator", void 0);
__decorate([PostConstruct], AutoWidthCalculator.prototype, "postConstruct", null);
AutoWidthCalculator = __decorate([Bean('autoWidthCalculator')], AutoWidthCalculator);
export { AutoWidthCalculator };