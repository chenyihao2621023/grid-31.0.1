import { Listeners } from '../../util/listeners';
import { Logger } from '../../util/logger';
export class LayoutService extends Listeners {
  constructor() {
    super(...arguments);
    this.layoutComplete = 'layout-complete';
  }
  addListener(eventType, handler) {
    if (this.isLayoutStage(eventType) || this.isLayoutComplete(eventType)) {
      return super.addListener(eventType, handler);
    }
    throw new Error(`ZING Charts - unsupported listener type: ${eventType}`);
  }
  dispatchPerformLayout(stage, ctx) {
    if (this.isLayoutStage(stage)) {
      return this.getListenersByType(stage).reduce((result, listener) => {
        try {
          return listener.handler(result);
        } catch (e) {
          Logger.errorOnce(e);
          return result;
        }
      }, ctx);
    }
    return ctx;
  }
  dispatchLayoutComplete(event) {
    this.dispatch(this.layoutComplete, event);
  }
  isLayoutStage(eventType) {
    return eventType !== this.layoutComplete;
  }
  isLayoutComplete(eventType) {
    return eventType === this.layoutComplete;
  }
}