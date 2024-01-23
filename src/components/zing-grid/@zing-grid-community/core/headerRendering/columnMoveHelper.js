import { HorizontalDirection } from "../constants/direction";
import { areEqual, includes, last, sortNumerically } from "../utils/array";
export class ColumnMoveHelper {
  static attemptMoveColumns(params) {
    const {
      isFromHeader,
      hDirection,
      xPosition,
      fromEnter,
      fakeEvent,
      pinned,
      gridOptionsService,
      columnModel
    } = params;
    const draggingLeft = hDirection === HorizontalDirection.Left;
    const draggingRight = hDirection === HorizontalDirection.Right;
    let {
      allMovingColumns
    } = params;
    if (isFromHeader) {
      let newCols = [];
      allMovingColumns.forEach(col => {
        var _a;
        let movingGroup = null;
        let parent = col.getParent();
        while (parent != null && parent.getDisplayedLeafColumns().length === 1) {
          movingGroup = parent;
          parent = parent.getParent();
        }
        if (movingGroup != null) {
          const isMarryChildren = !!((_a = movingGroup.getColGroupDef()) === null || _a === void 0 ? void 0 : _a.marryChildren);
          const columnsToMove = isMarryChildren ? movingGroup.getProvidedColumnGroup().getLeafColumns() : movingGroup.getLeafColumns();
          columnsToMove.forEach(newCol => {
            if (!newCols.includes(newCol)) {
              newCols.push(newCol);
            }
          });
        } else if (!newCols.includes(col)) {
          newCols.push(col);
        }
      });
      allMovingColumns = newCols;
    }
    const allMovingColumnsOrdered = allMovingColumns.slice();
    columnModel.sortColumnsLikeGridColumns(allMovingColumnsOrdered);
    const validMoves = this.calculateValidMoves({
      movingCols: allMovingColumnsOrdered,
      draggingRight,
      xPosition,
      pinned,
      gridOptionsService,
      columnModel
    });
    const oldIndex = this.calculateOldIndex(allMovingColumnsOrdered, columnModel);
    if (validMoves.length === 0) {
      return;
    }
    const firstValidMove = validMoves[0];
    let constrainDirection = oldIndex !== null && !fromEnter;
    if (isFromHeader) {
      constrainDirection = oldIndex !== null;
    }
    if (constrainDirection && !fakeEvent) {
      if (draggingLeft && firstValidMove >= oldIndex) {
        return;
      }
      if (draggingRight && firstValidMove <= oldIndex) {
        return;
      }
    }
    const displayedCols = columnModel.getAllDisplayedColumns();
    let potentialMoves = [];
    let targetOrder = null;
    for (let i = 0; i < validMoves.length; i++) {
      const move = validMoves[i];
      const order = columnModel.getProposedColumnOrder(allMovingColumnsOrdered, move);
      if (!columnModel.doesOrderPassRules(order)) {
        continue;
      }
      const displayedOrder = order.filter(col => displayedCols.includes(col));
      if (targetOrder === null) {
        targetOrder = displayedOrder;
      } else if (!areEqual(displayedOrder, targetOrder)) {
        break;
      }
      const fragCount = this.groupFragCount(order);
      potentialMoves.push({
        move,
        fragCount
      });
    }
    if (potentialMoves.length === 0) {
      return;
    }
    potentialMoves.sort((a, b) => a.fragCount - b.fragCount);
    return this.moveColumns(allMovingColumns, potentialMoves[0].move, 'uiColumnMoved', false, columnModel);
  }
  static moveColumns(columns, toIndex, source, finished, columnModel) {
    columnModel.moveColumns(columns, toIndex, source, finished);
    return finished ? null : {
      columns,
      toIndex
    };
  }
  static calculateOldIndex(movingCols, columnModel) {
    const gridCols = columnModel.getAllGridColumns();
    const indexes = sortNumerically(movingCols.map(col => gridCols.indexOf(col)));
    const firstIndex = indexes[0];
    const lastIndex = last(indexes);
    const spread = lastIndex - firstIndex;
    const gapsExist = spread !== indexes.length - 1;
    return gapsExist ? null : firstIndex;
  }
  static groupFragCount(columns) {
    function parents(col) {
      let result = [];
      let parent = col.getOriginalParent();
      while (parent != null) {
        result.push(parent);
        parent = parent.getOriginalParent();
      }
      return result;
    }
    let count = 0;
    for (let i = 0; i < columns.length - 1; i++) {
      let a = parents(columns[i]);
      let b = parents(columns[i + 1]);
      [a, b] = a.length > b.length ? [a, b] : [b, a];
      a.forEach(parent => {
        if (b.indexOf(parent) === -1) {
          count++;
        }
      });
    }
    return count;
  }
  static calculateValidMoves(params) {
    const {
      movingCols,
      draggingRight,
      xPosition,
      pinned,
      gridOptionsService,
      columnModel
    } = params;
    const isMoveBlocked = gridOptionsService.get('suppressMovableColumns') || movingCols.some(col => col.getColDef().suppressMovable);
    if (isMoveBlocked) {
      return [];
    }
    const allDisplayedCols = columnModel.getDisplayedColumns(pinned);
    const allGridCols = columnModel.getAllGridColumns();
    const movingDisplayedCols = allDisplayedCols.filter(col => includes(movingCols, col));
    const otherDisplayedCols = allDisplayedCols.filter(col => !includes(movingCols, col));
    const otherGridCols = allGridCols.filter(col => !includes(movingCols, col));
    let displayIndex = 0;
    let availableWidth = xPosition;
    if (draggingRight) {
      let widthOfMovingDisplayedCols = 0;
      movingDisplayedCols.forEach(col => widthOfMovingDisplayedCols += col.getActualWidth());
      availableWidth -= widthOfMovingDisplayedCols;
    }
    if (availableWidth > 0) {
      for (let i = 0; i < otherDisplayedCols.length; i++) {
        const col = otherDisplayedCols[i];
        availableWidth -= col.getActualWidth();
        if (availableWidth < 0) {
          break;
        }
        displayIndex++;
      }
      if (draggingRight) {
        displayIndex++;
      }
    }
    let firstValidMove;
    if (displayIndex > 0) {
      const leftColumn = otherDisplayedCols[displayIndex - 1];
      firstValidMove = otherGridCols.indexOf(leftColumn) + 1;
    } else {
      firstValidMove = otherGridCols.indexOf(otherDisplayedCols[0]);
      if (firstValidMove === -1) {
        firstValidMove = 0;
      }
    }
    const validMoves = [firstValidMove];
    const numberComparator = (a, b) => a - b;
    if (draggingRight) {
      let pointer = firstValidMove + 1;
      const lastIndex = allGridCols.length - 1;
      while (pointer <= lastIndex) {
        validMoves.push(pointer);
        pointer++;
      }
      validMoves.sort(numberComparator);
    } else {
      let pointer = firstValidMove;
      const lastIndex = allGridCols.length - 1;
      let displacedCol = allGridCols[pointer];
      while (pointer <= lastIndex && allDisplayedCols.indexOf(displacedCol) < 0) {
        pointer++;
        validMoves.push(pointer);
        displacedCol = allGridCols[pointer];
      }
      pointer = firstValidMove - 1;
      const firstDisplayIndex = 0;
      while (pointer >= firstDisplayIndex) {
        validMoves.push(pointer);
        pointer--;
      }
      validMoves.sort(numberComparator).reverse();
    }
    return validMoves;
  }
  static normaliseX(x, pinned, fromKeyboard, gridOptionsService, ctrlsService) {
    const eViewport = ctrlsService.getHeaderRowContainerCtrl(pinned).getViewport();
    if (fromKeyboard) {
      x -= eViewport.getBoundingClientRect().left;
    }
    if (gridOptionsService.get('enableRtl')) {
      const clientWidth = eViewport.clientWidth;
      x = clientWidth - x;
    }
    if (pinned == null) {
      x += ctrlsService.getCenterRowContainerCtrl().getCenterViewportScrollLeft();
    }
    return x;
  }
}