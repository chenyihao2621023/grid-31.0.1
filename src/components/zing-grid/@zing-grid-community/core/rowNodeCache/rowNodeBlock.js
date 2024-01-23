import { BeanStub } from "../context/beanStub";
export class RowNodeBlock extends BeanStub {
  constructor(id) {
    super();
    this.state = RowNodeBlock.STATE_WAITING_TO_LOAD;
    this.version = 0;
    this.id = id;
  }
  getId() {
    return this.id;
  }
  load() {
    this.state = RowNodeBlock.STATE_LOADING;
    this.loadFromDatasource();
  }
  getVersion() {
    return this.version;
  }
  setStateWaitingToLoad() {
    this.version++;
    this.state = RowNodeBlock.STATE_WAITING_TO_LOAD;
  }
  getState() {
    return this.state;
  }
  pageLoadFailed(version) {
    const requestMostRecentAndLive = this.isRequestMostRecentAndLive(version);
    if (requestMostRecentAndLive) {
      this.state = RowNodeBlock.STATE_FAILED;
      this.processServerFail();
    }
    this.dispatchLoadCompleted(false);
  }
  success(version, params) {
    this.successCommon(version, params);
  }
  pageLoaded(version, rows, lastRow) {
    this.successCommon(version, {
      rowData: rows,
      rowCount: lastRow
    });
  }
  isRequestMostRecentAndLive(version) {
    const thisIsMostRecentRequest = version === this.version;
    const weAreNotDestroyed = this.isAlive();
    return thisIsMostRecentRequest && weAreNotDestroyed;
  }
  successCommon(version, params) {
    this.dispatchLoadCompleted();
    const requestMostRecentAndLive = this.isRequestMostRecentAndLive(version);
    if (requestMostRecentAndLive) {
      this.state = RowNodeBlock.STATE_LOADED;
      this.processServerResult(params);
    }
  }
  dispatchLoadCompleted(success = true) {
    const event = {
      type: RowNodeBlock.EVENT_LOAD_COMPLETE,
      success: success,
      block: this
    };
    this.dispatchEvent(event);
  }
}
RowNodeBlock.EVENT_LOAD_COMPLETE = 'loadComplete';
RowNodeBlock.STATE_WAITING_TO_LOAD = 'needsLoading';
RowNodeBlock.STATE_LOADING = 'loading';
RowNodeBlock.STATE_LOADED = 'loaded';
RowNodeBlock.STATE_FAILED = 'failed';