import { toStringOrNull } from "../utils/generic";
export class ColumnKeyCreator {
  constructor() {
    this.existingKeys = {};
  }
  addExistingKeys(keys) {
    for (let i = 0; i < keys.length; i++) {
      this.existingKeys[keys[i]] = true;
    }
  }
  getUniqueKey(colId, colField) {
    colId = toStringOrNull(colId);
    let count = 0;
    while (true) {
      let idToTry;
      if (colId) {
        idToTry = colId;
        if (count !== 0) {
          idToTry += '_' + count;
        }
      } else if (colField) {
        idToTry = colField;
        if (count !== 0) {
          idToTry += '_' + count;
        }
      } else {
        idToTry = count;
      }
      if (!this.existingKeys[idToTry]) {
        this.existingKeys[idToTry] = true;
        return String(idToTry);
      }
      count++;
    }
  }
}