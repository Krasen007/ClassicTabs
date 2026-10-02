// Chromium 136+ (which Opera 136, based on Chromium 152, ships by default)
// exposes a `browser` namespace to extensions alongside `chrome`.
//
// webextension-polyfill decides whether it still needs to promisify the
// extension APIs with this test at the very bottom of its module body:
//
//     if (typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype) {
//         module.exports = wrapAPIs(chrome);
//     } else {
//         module.exports = browser;
//     }
//
// Chromium's `browser` is a plain object, so both halves of that test fail and
// the polyfill assumes it has been handed an already-promisified, Firefox-style
// API. It has not: it is Chromium's callback-based API. Every
// `await browser.tabs.get(...)` therefore resolves to `undefined` and the
// extension breaks silently, with nothing thrown.
//
// Clearing the global *before* the polyfill's own body runs makes the test
// succeed, so the polyfill wraps `chrome` and promisifies it as intended. This
// is why the delete has to happen here, in the shim, rather than at the top of
// an importing module: `import` declarations are hoisted and evaluated before
// any statement in the importing file, so a delete in the importer would always
// run too late.
//
// `webextension-polyfill$` is aliased to this file by webextension-toolbox-config.js.
// The `$` makes the alias an exact-match only, so the require below (which is a
// longer path) still resolves to the real package instead of recursing back here.
try {
    delete globalThis.browser;
}
catch (e) {
    // The property may be non-configurable. Assigning `undefined` is enough:
    // `typeof browser === "undefined"` then holds just the same.
    globalThis.browser = undefined;
}

module.exports = require('webextension-polyfill/dist/browser-polyfill.js');