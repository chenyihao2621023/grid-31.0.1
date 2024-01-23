export var ZingPromiseStatus;
(function (ZingPromiseStatus) {
    ZingPromiseStatus[ZingPromiseStatus["IN_PROGRESS"] = 0] = "IN_PROGRESS";
    ZingPromiseStatus[ZingPromiseStatus["RESOLVED"] = 1] = "RESOLVED";
})(ZingPromiseStatus || (ZingPromiseStatus = {}));
export class ZingPromise {
    static all(promises) {
        return new ZingPromise(resolve => {
            let remainingToResolve = promises.length;
            const combinedValues = new Array(remainingToResolve);
            promises.forEach((promise, index) => {
                promise.then(value => {
                    combinedValues[index] = value;
                    remainingToResolve--;
                    if (remainingToResolve === 0) {
                        resolve(combinedValues);
                    }
                });
            });
        });
    }
    static resolve(value = null) {
        return new ZingPromise(resolve => resolve(value));
    }
    constructor(callback) {
        this.status = ZingPromiseStatus.IN_PROGRESS;
        this.resolution = null;
        this.waiters = [];
        callback(value => this.onDone(value), params => this.onReject(params));
    }
    then(func) {
        return new ZingPromise(resolve => {
            if (this.status === ZingPromiseStatus.RESOLVED) {
                resolve(func(this.resolution));
            }
            else {
                this.waiters.push(value => resolve(func(value)));
            }
        });
    }
    resolveNow(ifNotResolvedValue, ifResolved) {
        return this.status === ZingPromiseStatus.RESOLVED ? ifResolved(this.resolution) : ifNotResolvedValue;
    }
    onDone(value) {
        this.status = ZingPromiseStatus.RESOLVED;
        this.resolution = value;
        this.waiters.forEach(waiter => waiter(value));
    }
    onReject(params) {
        console.warn('TBI');
    }
}
