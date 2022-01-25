class SettingStorageClass {
    constructor(defaults, options) {
        this.defaults = {};
        this.initSetting = '__initialized__';
        this.prefix = '';
        this.storage = localStorage;
        this.useAccessors = true;
        this._firstRun = false;
        var self = this;
        if (defaults !== undefined) {
            this.defaults = defaults || {};
        }
        if (options !== undefined) {
            ['initSetting', 'prefix', 'storage', 'useAccessors'].forEach((key) => {
                if (options[key] !== undefined) {
                    self[key] = options[key];
                }
            });
        }
        if (!this.get(this.initSetting)) {
            this._firstRun = true;
        }
        if (this.useAccessors) {
            this._defineAccessors();
        }
    }
    get firstRun() {
        return this._firstRun;
    }
    init() {
        this._fillDefaults();
        if (this.firstRun) {
            this.set(this.initSetting, true);
        }
    }
    get(key) {
        var result = this.storage[this.prefix + key];
        return result === undefined ? null : JSON.parse(result);
    }
    set(key, value) {
        this.storage[this.prefix + key] = JSON.stringify(value);
    }
    getAll() {
        var result = {};
        for (var key in this.defaults) {
            result[key] = this.get(key);
        }
        return result;
    }
    setAll(settings) {
        for (var key in settings) {
            if (settings.hasOwnProperty(key)) {
                this.set(key, settings[key]);
            }
        }
    }
    isDefined(key) {
        return this.storage[this.prefix + key] !== undefined;
    }
    reset(key) {
        if (key in this.defaults) {
            this.set(key, this.defaults[key]);
        }
        else {
            this.set(key, null);
        }
    }
    resetAll() {
        for (var key in this.defaults) {
            if (this.defaults.hasOwnProperty(key)) {
                this.set(key, this.defaults[key]);
            }
        }
    }
    _fillDefaults() {
        for (var key in this.defaults) {
            if (this.defaults.hasOwnProperty(key)) {
                if (!this.isDefined(key)) {
                    this.set(key, this.defaults[key]);
                }
            }
        }
    }
    _defineAccessors() {
        var descriptors = {};
        var reserved = [
            'defaults', 'fillDefaults', 'get', 'getAll', 'init',
            'initSetting', 'isDefined', 'prefix', 'reset', 'resetAll',
            'set', 'setAll', 'storage', 'useAccessors'
        ];
        function sanitizeName(key) {
            // remove invalid start characters
            key = key.replace(/^[^a-zA-Z_]+/, '');
            // consolidate invalid characters to dashes
            key = key.replace(/[^a-zA-Z0-9_]+/g, '-');
            // convert dashes to camel case (foo-bar -> fooBar)
            var i = -1;
            while ((i = key.indexOf('-')) != -1) {
                key = key.substr(0, i) + key.substr(i + 1, 1).toUpperCase() + key.substr(i + 2);
            }
            // if name is reserved, prefix with underscore
            if (reserved.indexOf(key) >= 0) {
                key = '_' + key;
            }
            return key;
        }
        function makeDesc(key) {
            return {
                get: function () { return this.get(key); },
                set: function (value) { this.set(key, value); },
                enumerable: true,
            };
        }
        for (var key in this.defaults) {
            var propName = sanitizeName(key);
            if (this.defaults.hasOwnProperty(key)) {
                descriptors[propName] = makeDesc(key);
            }
        }
        Object.defineProperties(this, descriptors);
    }
}
/**
* @param defaults A map containing setting names and their default values
* @param options Configuration options
*/
function CreateSettings(defaults, options) {
    return new SettingStorageClass(defaults, options);
}
//# sourceMappingURL=storage.js.map