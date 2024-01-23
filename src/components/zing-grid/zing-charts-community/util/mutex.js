var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
import { Logger } from './logger';
export class Mutex {
  constructor() {
    this.available = true;
    this.acquireQueue = [];
  }
  acquire(cb) {
    return new Promise(resolve => {
      this.acquireQueue.push([cb, resolve]);
      if (this.available) {
        this.dispatchNext();
      }
    });
  }
  acquireImmediately(cb) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.available) {
        return false;
      }
      yield this.acquire(cb);
      return true;
    });
  }
  waitForClearAcquireQueue() {
    return __awaiter(this, void 0, void 0, function* () {
      return this.acquire(() => __awaiter(this, void 0, void 0, function* () {
        return undefined;
      }));
    });
  }
  dispatchNext() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
      this.available = false;
      let [next, done] = (_a = this.acquireQueue.shift()) !== null && _a !== void 0 ? _a : [];
      while (next) {
        try {
          yield next();
          done === null || done === void 0 ? void 0 : done();
        } catch (error) {
          Logger.error('mutex callback error', error);
          done === null || done === void 0 ? void 0 : done();
        }
        [next, done] = (_b = this.acquireQueue.shift()) !== null && _b !== void 0 ? _b : [];
      }
      this.available = true;
    });
  }
}