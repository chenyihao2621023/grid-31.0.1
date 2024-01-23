
export class TimeInterval {
    constructor(_encode, _decode, _rangeCallback) {
        this._encode = _encode;
        this._decode = _decode;
        this._rangeCallback = _rangeCallback;
    }
    
    floor(date) {
        const d = new Date(date);
        const e = this._encode(d);
        return this._decode(e);
    }
    
    ceil(date) {
        const d = new Date(Number(date) - 1);
        const e = this._encode(d);
        return this._decode(e + 1);
    }
    
    range(start, stop, extend) {
        var _a;
        const rangeCallback = (_a = this._rangeCallback) === null || _a === void 0 ? void 0 : _a.call(this, start, stop);
        const e0 = this._encode(extend ? this.floor(start) : this.ceil(start));
        const e1 = this._encode(extend ? this.ceil(stop) : this.floor(stop));
        if (e1 < e0) {
            return [];
        }
        const range = [];
        for (let e = e0; e <= e1; e++) {
            const d = this._decode(e);
            range.push(d);
        }
        rangeCallback === null || rangeCallback === void 0 ? void 0 : rangeCallback();
        return range;
    }
}
export class CountableTimeInterval extends TimeInterval {
    getOffset(snapTo, step) {
        const s = typeof snapTo === 'number' || snapTo instanceof Date ? this._encode(new Date(snapTo)) : 0;
        return Math.floor(s) % step;
    }
    
    every(step, options) {
        let offset = 0;
        let rangeCallback;
        const { snapTo = 'start' } = options !== null && options !== void 0 ? options : {};
        if (typeof snapTo === 'string') {
            const initialOffset = offset;
            rangeCallback = (start, stop) => {
                const s = snapTo === 'start' ? start : stop;
                offset = this.getOffset(s, step);
                return () => (offset = initialOffset);
            };
        }
        else if (typeof snapTo === 'number') {
            offset = this.getOffset(new Date(snapTo), step);
        }
        else if (snapTo instanceof Date) {
            offset = this.getOffset(snapTo, step);
        }
        const encode = (date) => {
            const e = this._encode(date);
            return Math.floor((e - offset) / step);
        };
        const decode = (encoded) => {
            return this._decode(encoded * step + offset);
        };
        return new TimeInterval(encode, decode, rangeCallback);
    }
}
