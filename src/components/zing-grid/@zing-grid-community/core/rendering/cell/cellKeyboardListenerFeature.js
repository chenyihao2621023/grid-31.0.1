import { BeanStub } from "../../context/beanStub";
import { KeyCode } from "../../constants/keyCode";
import { isDeleteKey } from "../../utils/keyboard";
import { Events } from "../../eventKeys";
export class CellKeyboardListenerFeature extends BeanStub {
  constructor(ctrl, beans, column, rowNode, rowCtrl) {
    super();
    this.cellCtrl = ctrl;
    this.beans = beans;
    this.rowNode = rowNode;
    this.rowCtrl = rowCtrl;
  }
  setComp(eGui) {
    this.eGui = eGui;
  }
  onKeyDown(event) {
    const key = event.key;
    switch (key) {
      case KeyCode.ENTER:
        this.onEnterKeyDown(event);
        break;
      case KeyCode.F2:
        this.onF2KeyDown(event);
        break;
      case KeyCode.ESCAPE:
        this.onEscapeKeyDown(event);
        break;
      case KeyCode.TAB:
        this.onTabKeyDown(event);
        break;
      case KeyCode.BACKSPACE:
      case KeyCode.DELETE:
        this.onBackspaceOrDeleteKeyDown(key, event);
        break;
      case KeyCode.DOWN:
      case KeyCode.UP:
      case KeyCode.RIGHT:
      case KeyCode.LEFT:
        this.onNavigationKeyDown(event, key);
        break;
    }
  }
  onNavigationKeyDown(event, key) {
    if (this.cellCtrl.isEditing()) {
      return;
    }
    if (event.shiftKey && this.cellCtrl.isRangeSelectionEnabled()) {
      this.onShiftRangeSelect(event);
    } else {
      this.beans.navigationService.navigateToNextCell(event, key, this.cellCtrl.getCellPosition(), true);
    }
    event.preventDefault();
  }
  onShiftRangeSelect(event) {
    if (!this.beans.rangeService) {
      return;
    }
    const endCell = this.beans.rangeService.extendLatestRangeInDirection(event);
    if (endCell) {
      this.beans.navigationService.ensureCellVisible(endCell);
    }
  }
  onTabKeyDown(event) {
    this.beans.navigationService.onTabKeyDown(this.cellCtrl, event);
  }
  onBackspaceOrDeleteKeyDown(key, event) {
    const {
      cellCtrl,
      beans,
      rowNode
    } = this;
    const {
      gridOptionsService,
      rangeService,
      eventService
    } = beans;
    if (cellCtrl.isEditing()) {
      return;
    }
    eventService.dispatchEvent({
      type: Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_START
    });
    if (isDeleteKey(key, gridOptionsService.get('enableCellEditingOnBackspace'))) {
      if (rangeService && gridOptionsService.get('enableRangeSelection')) {
        rangeService.clearCellRangeCellValues({
          dispatchWrapperEvents: true,
          wrapperEventSource: 'deleteKey'
        });
      } else if (cellCtrl.isCellEditable()) {
        rowNode.setDataValue(cellCtrl.getColumn(), null, 'cellClear');
      }
    } else {
      cellCtrl.startRowOrCellEdit(key, event);
    }
    eventService.dispatchEvent({
      type: Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_END
    });
  }
  onEnterKeyDown(e) {
    if (this.cellCtrl.isEditing() || this.rowCtrl.isEditing()) {
      this.cellCtrl.stopEditingAndFocus(false, e.shiftKey);
    } else {
      if (this.beans.gridOptionsService.get('enterNavigatesVertically')) {
        const key = e.shiftKey ? KeyCode.UP : KeyCode.DOWN;
        this.beans.navigationService.navigateToNextCell(null, key, this.cellCtrl.getCellPosition(), false);
      } else {
        this.cellCtrl.startRowOrCellEdit(KeyCode.ENTER, e);
        if (this.cellCtrl.isEditing()) {
          e.preventDefault();
        }
      }
    }
  }
  onF2KeyDown(event) {
    if (!this.cellCtrl.isEditing()) {
      this.cellCtrl.startRowOrCellEdit(KeyCode.F2, event);
    }
  }
  onEscapeKeyDown(event) {
    if (this.cellCtrl.isEditing()) {
      this.cellCtrl.stopRowOrCellEdit(true);
      this.cellCtrl.focusCell(true);
    }
  }
  processCharacter(event) {
    const eventTarget = event.target;
    const eventOnChildComponent = eventTarget !== this.eGui;
    if (eventOnChildComponent || this.cellCtrl.isEditing()) {
      return;
    }
    const key = event.key;
    if (key === ' ') {
      this.onSpaceKeyDown(event);
    } else {
      this.cellCtrl.startRowOrCellEdit(key, event);
      event.preventDefault();
    }
  }
  onSpaceKeyDown(event) {
    const {
      gridOptionsService
    } = this.beans;
    if (!this.cellCtrl.isEditing() && gridOptionsService.isRowSelection()) {
      const currentSelection = this.rowNode.isSelected();
      const newSelection = !currentSelection;
      if (newSelection || !gridOptionsService.get('suppressRowDeselection')) {
        const groupSelectsFiltered = this.beans.gridOptionsService.get('groupSelectsFiltered');
        const updatedCount = this.rowNode.setSelectedParams({
          newValue: newSelection,
          rangeSelect: event.shiftKey,
          groupSelectsFiltered: groupSelectsFiltered,
          event,
          source: 'spaceKey'
        });
        if (currentSelection === undefined && updatedCount === 0) {
          this.rowNode.setSelectedParams({
            newValue: false,
            rangeSelect: event.shiftKey,
            groupSelectsFiltered: groupSelectsFiltered,
            event,
            source: 'spaceKey'
          });
        }
      }
    }
    event.preventDefault();
  }
  destroy() {
    super.destroy();
  }
}