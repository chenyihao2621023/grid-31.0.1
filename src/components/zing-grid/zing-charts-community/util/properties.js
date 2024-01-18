import { ChangeDetectable } from '../scene/changeDetectable';
import { extractDecoratedPropertyMetadata, listDecoratedProperties } from './decorator';
import { Logger } from './logger';
import { isArray } from './type-guards';
export class BaseProperties extends ChangeDetectable {
    constructor(className) {
        super();
        this.className = className;
    }
    set(properties) {
        const keys = new Set(Object.keys(properties));
        for (const propertyKey of listDecoratedProperties(this)) {
            if (keys.has(propertyKey)) {
                const value = properties[propertyKey];
                const self = this;
                if (isProperties(self[propertyKey])) {
                    // re-set property to force re-validation
                    self[propertyKey] =
                        self[propertyKey] instanceof PropertiesArray
                            ? self[propertyKey].reset(value)
                            : self[propertyKey].set(value);
                }
                else {
                    self[propertyKey] = value;
                }
                keys.delete(propertyKey);
            }
        }
        for (const unknownKey of keys) {
            const { className = this.constructor.name } = this;
            Logger.warn(`unable to set [${unknownKey}] in ${className} - property is unknown`);
        }
        return this;
    }
    isValid() {
        return listDecoratedProperties(this).every((propertyKey) => {
            const { optional } = extractDecoratedPropertyMetadata(this, propertyKey);
            return optional || typeof this[propertyKey] !== 'undefined';
        });
    }
    toJson() {
        return listDecoratedProperties(this).reduce((object, propertyKey) => {
            object[propertyKey] = this[propertyKey];
            return object;
        }, {});
    }
}
export class PropertiesArray extends Array {
    constructor(itemFactory, ...properties) {
        super(properties.length);
        Object.defineProperty(this, 'itemFactory', { value: itemFactory, enumerable: false, configurable: false });
        this.set(properties);
    }
    set(properties) {
        if (isArray(properties)) {
            this.length = properties.length;
            for (let i = 0; i < properties.length; i++) {
                this[i] = new this.itemFactory().set(properties[i]);
            }
        }
        return this;
    }
    reset(properties) {
        return new PropertiesArray(this.itemFactory, ...properties);
    }
}
export function isProperties(value) {
    return value instanceof BaseProperties || value instanceof PropertiesArray;
}
//# sourceMappingURL=properties.js.map