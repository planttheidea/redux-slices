'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

/**
 * Add the `type` as a static property onto the `actionCreator`.
 *
 * @param type - action type returned by the `actionCreator`
 * @param actionCreator - method to generate the action for dispatch
 * @returns - `actionCreator` augmented with the `type` property
 */
/**
 * Are the two values passed strictly equal to one another.
 *
 * @param a - the first value to compare
 * @param b - the second value to compare
 * @returns - are the values passed strictly equal
 */
var isStrictlyEqual = function (a, b) { return a === b; };
/**
 * Does a value in the array match the given predicate.
 *
 * @param array - array of values to test
 * @param predicate - method to test, where a truthy value returned denotes a match
 * @returns - whether a value in the array matches the predicate
 */
var some = function (array, predicate) {
    for (var index = 0, length_1 = array.length; index < length_1; ++index) {
        if (predicate(array[index], index)) {
            return true;
        }
    }
    return false;
};

var Slice = /** @class */ (function () {
    function Slice(name, initialState) {
        if (initialState === void 0) { initialState = {}; }
        // Bind all methods to the instance to ensure destructured use works as expected.
        this.createAction = this.createAction.bind(this);
        this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
        this.createSelector = this.createSelector.bind(this);
        this.getState = this.getState.bind(this);
        this.reducer = this.reducer.bind(this);
        this.setReducer = this.setReducer.bind(this);
        this.__handledTypes = null;
        // Provide placeholder reducer for slices that don't have any handlers.
        this.__reducer = function () { return initialState; };
        this.__state = initialState;
        this.initialState = initialState;
        this.name = name;
    }
    /**
     * Create an action creator that will generate an action for dispatching. This action shape follows
     * FSA (Flux Standard Action) format:
     * - `type` (string value representing action)
     * - `payload` - (optional) primary value dispatched for the `type`
     * - `meta` - (optional) supporting value for the `type`
     *
     * The `type` passed is automatically namespaced based on the slice name.
     *
     * @param unscopedType - action type
     * @param getPayload - optional handler to get the value used for the `payload` property
     * @param getMeta - optional handler to get the value used for the `meta` property`
     * @returns - action creator, specific to the payload and meta expected
     */
    Slice.prototype.createAction = function (unscopedType, getPayload, getMeta) {
        var type = this.name + "/" + unscopedType;
        var actionCreator;
        if (typeof getPayload === 'function' && typeof getMeta === 'function') {
            actionCreator = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return ({
                    payload: getPayload.apply(void 0, args),
                    meta: getMeta.apply(void 0, args),
                    type: type,
                });
            };
        }
        else if (typeof getPayload === 'function') {
            actionCreator = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return ({
                    payload: getPayload.apply(void 0, args),
                    type: type,
                });
            };
        }
        else if (typeof getMeta === 'function') {
            actionCreator = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return ({ meta: getMeta.apply(void 0, args), type: type });
            };
        }
        else {
            actionCreator = function (payload) { return ({ payload: payload, type: type }); };
        }
        Object.defineProperty(actionCreator, 'type', {
            configurable: true,
            enumerable: false,
            value: type,
            writable: true,
        });
        return actionCreator;
    };
    /**
     * Create a selector specific to the slice state that is memoized based on the arguments passed.
     *
     * @param selector - slice-specific selector function
     * @param isEqual - method to determine equality of arguments passed to the selector
     * @returns - result of calling the selector
     */
    Slice.prototype.createMemoizedSelector = function (selector, isEqual) {
        var _this = this;
        if (isEqual === void 0) { isEqual = isStrictlyEqual; }
        var prevState;
        var prevArgs = [];
        var prevResult;
        var memoizedSelector = function (state) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var nextState = state[_this.name];
            if (!prevState ||
                prevState !== nextState ||
                args.length !== prevArgs.length ||
                some(args, function (arg, index) { return isEqual(prevArgs[index], arg); })) {
                prevState = nextState;
                prevArgs = args;
                prevResult = selector.apply(void 0, __spreadArray([nextState], args));
            }
            return prevResult;
        };
        memoizedSelector.clear = function () {
            prevState = undefined;
            prevArgs = [];
            prevResult = undefined;
        };
        return memoizedSelector;
    };
    /**
     * Create a selector that is specific to the slice state.
     *
     * @param selector - slice-specific selector function
     * @returns - result of calling the selector
     */
    Slice.prototype.createSelector = function (selector) {
        var _this = this;
        // Simple wrapper that selects from the specific slice of state.
        return function (state) {
            var remainingArgs = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                remainingArgs[_i - 1] = arguments[_i];
            }
            return selector.apply(void 0, __spreadArray([state[_this.name]], remainingArgs));
        };
    };
    /**
     * Get the current state of the slice
     *
     * @returns - current state of the slice
     */
    Slice.prototype.getState = function () {
        return this.__state;
    };
    /**
     * Reducer function that will derive the next state of the slice based on the current state
     * and the action dispatched.
     *
     * @param state - current slice state
     * @param action - dispatched action
     * @returns - next slice state
     */
    Slice.prototype.reducer = function (state, action) {
        if (!state) {
            state = this.__state;
        }
        if (this.__handledTypes) {
            var handler = this.__handledTypes[action.type];
            if (handler) {
                // If a handler for the given action exists, then we can call it directly instead of
                // leveraging a wrapping reducer.
                this.__state = handler(state, action);
            }
            return this.__state;
        }
        if (this.__reducer) {
            // If a functional reducer is used instead of the custom handlers, just call it directly.
            return this.__reducer(state, action);
        }
        // This should never happen, but it would be a scenario where `setReducer` was explicitly called with `null`.
        throw new Error("No reducer or action handlers were found for `" + this.name + "`.");
    };
    /**
     * Set the internal reducer based on the `handler` passed.
     * - If a function is passed, it is used directly as the reducer
     * - If an object is passed, it is used as a map of actionType => reducer handlers
     *
     * An object is preferred, as it reduces the amount of work that is done upon each dispatch. This is because
     * `Slice` will optimize updates based on whether the dispatched action is handled by the slice or not.
     *
     * @param handler - map of action types to handle, or a standard reducer function
     */
    Slice.prototype.setReducer = function (handler) {
        if (typeof handler === 'function') {
            this.__reducer = handler;
            this.__handledTypes = null;
        }
        else if (typeof handler === 'object') {
            this.__reducer = null;
            this.__handledTypes = handler;
        }
        else {
            throw new Error("Handlers passed to `Slice<" + this.name + ">.setReducer` must be either a reducer function or an object of reducers that handle specific action types.");
        }
    };
    return Slice;
}());

/**
 * Create a new Slice instance based on the `name` and `initialState` passed.
 *
 * @param name - name of the slice
 * @param initialState - initial state of the slice
 * @returns - Slice instance
 */
var createSlice = function (name, initialState) { return new Slice(name, initialState); };

exports.createSlice = createSlice;
//# sourceMappingURL=redux-slices.cjs.js.map
