// Runtime check that the shim forces webextension-polyfill down its
// wrapAPIs(chrome) path when a plain-object `browser` global exists, which is
// what Chromium 136+ (Opera 136 / Chromium 152) exposes.
//
// Run with: node shim/test-shim.js
const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHIM = path.join(__dirname, 'webextension-polyfill.js');

function makeCallbackChrome() {
    // Chromium's `chrome` namespace: callback based, returns undefined.
    return {
        runtime: { id: 'test-extension-id', lastError: undefined },
        tabs: {
            get(id, callback) {
                // A missing callback is the signature of the bug: the unpatched
                // polyfill called the API without appending one.
                if (typeof callback !== 'function') {
                    return undefined;
                }
                setTimeout(() => callback({ id, index: 3, windowId: 1 }), 0);
            },
            query(_info, callback) {
                setTimeout(() => callback([{ id: 7, active: true, windowId: 1, index: 0 }]), 0);
            },
            update(_id, _props, callback) {
                setTimeout(callback, 0);
            },
        },
    };
}

// Simulate the Opera 136 environment: a plain-object `browser` global whose
// prototype is Object.prototype, i.e. exactly what fools the polyfill's check.
function installOpera136Globals() {
    global.chrome = makeCallbackChrome();
    global.browser = { runtime: { id: 'test-extension-id' }, tabs: global.chrome.tabs };
}

function loadPolyfillThroughShim() {
    // Resolve exactly like webpack's exact-match alias does.
    const shim = require(SHIM);
    return shim;
}

async function main() {
    installOpera136Globals();
    assert.ok(
        Object.getPrototypeOf(global.browser) === Object.prototype,
        'precondition: browser must be a plain object for this to be a valid test',
    );

    const browser = loadPolyfillThroughShim();

    // The whole point: the global is gone, so the polyfill promisified instead
    // of handing back Chromium's callback API.
    assert.strictEqual(
        typeof global.browser,
        'undefined',
        'shim should have removed the plain-object browser global',
    );

    assert.ok(browser !== global.chrome, 'browser must not be the raw chrome object');

    // The regression this guards against: without the shim these returned
    // undefined (never a Promise), so every `await` silently produced undefined.
    const gotTab = browser.tabs.get(42);
    assert.ok(
        gotTab && typeof gotTab.then === 'function',
        'browser.tabs.get() must return a Promise',
    );
    assert.deepStrictEqual(await gotTab, { id: 42, index: 3, windowId: 1 });

    const queried = browser.tabs.query({ active: true });
    assert.ok(
        queried && typeof queried.then === 'function',
        'browser.tabs.query() must return a Promise',
    );
    assert.deepStrictEqual(await queried, [{ id: 7, active: true, windowId: 1, index: 0 }]);

    // Prove the negative case too: without the shim, the polyfill picks the
    // un-promisified path and returns undefined. This is the original bug.
    const polyfillPath = require.resolve('webextension-polyfill', { paths: [ROOT] });
    delete require.cache[polyfillPath];
    delete require.cache[SHIM];

    global.browser = { runtime: { id: 'test-extension-id' }, tabs: global.chrome.tabs };
    const unfixed = require(polyfillPath);
    assert.strictEqual(
        unfixed.tabs.get(42),
        undefined,
        'unpatched polyfill should return undefined (demonstrating the bug)',
    );

    console.log('PASS: shim promisifies the API; unpatched polyfill does not.');
}

main().catch(e => {
    console.error('FAIL:', e.message);
    process.exit(1);
});