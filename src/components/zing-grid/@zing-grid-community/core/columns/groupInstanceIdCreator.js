export class GroupInstanceIdCreator {
  constructor() {
    this.existingIds = {};
  }
  getInstanceIdForKey(key) {
    const lastResult = this.existingIds[key];
    let result;
    if (typeof lastResult !== 'number') {
      result = 0;
    } else {
      result = lastResult + 1;
    }
    this.existingIds[key] = result;
    return result;
  }
}