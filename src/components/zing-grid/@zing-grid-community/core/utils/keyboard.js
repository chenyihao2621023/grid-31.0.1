import { KeyCode } from '../constants/keyCode';
import { isMacOsUserAgent } from './browser';
import { exists } from './generic';
const A_KEYCODE = 65;
const C_KEYCODE = 67;
const V_KEYCODE = 86;
const D_KEYCODE = 68;
const Z_KEYCODE = 90;
const Y_KEYCODE = 89;
export function isEventFromPrintableCharacter(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return false;
  }
  const printableCharacter = event.key.length === 1;
  return printableCharacter;
}
export function isUserSuppressingKeyboardEvent(gridOptionsService, keyboardEvent, rowNode, column, editing) {
  const colDefFunc = column ? column.getColDef().suppressKeyboardEvent : undefined;
  if (!colDefFunc) {
    return false;
  }
  const params = {
    event: keyboardEvent,
    editing,
    column,
    api: gridOptionsService.api,
    node: rowNode,
    data: rowNode.data,
    colDef: column.getColDef(),
    context: gridOptionsService.context,
    columnApi: gridOptionsService.columnApi
  };
  if (colDefFunc) {
    const colDefFuncResult = colDefFunc(params);
    if (colDefFuncResult) {
      return true;
    }
  }
  return false;
}
export function isUserSuppressingHeaderKeyboardEvent(gridOptionsService, keyboardEvent, headerRowIndex, column) {
  const colDef = column.getDefinition();
  const colDefFunc = colDef && colDef.suppressHeaderKeyboardEvent;
  if (!exists(colDefFunc)) {
    return false;
  }
  const params = {
    api: gridOptionsService.api,
    columnApi: gridOptionsService.columnApi,
    context: gridOptionsService.context,
    colDef: colDef,
    column,
    headerRowIndex,
    event: keyboardEvent
  };
  return !!colDefFunc(params);
}
export function normaliseQwertyAzerty(keyboardEvent) {
  const {
    keyCode
  } = keyboardEvent;
  let code;
  switch (keyCode) {
    case A_KEYCODE:
      code = KeyCode.A;
      break;
    case C_KEYCODE:
      code = KeyCode.C;
      break;
    case V_KEYCODE:
      code = KeyCode.V;
      break;
    case D_KEYCODE:
      code = KeyCode.D;
      break;
    case Z_KEYCODE:
      code = KeyCode.Z;
      break;
    case Y_KEYCODE:
      code = KeyCode.Y;
      break;
    default:
      code = keyboardEvent.code;
  }
  return code;
}
export function isDeleteKey(key, alwaysReturnFalseOnBackspace = false) {
  if (key === KeyCode.DELETE) {
    return true;
  }
  if (!alwaysReturnFalseOnBackspace && key === KeyCode.BACKSPACE) {
    return isMacOsUserAgent();
  }
  return false;
}