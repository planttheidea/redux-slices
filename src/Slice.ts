import { applyErrorToAction, isStrictlyEqual, some } from './utils';

import type {
  ActionCreator,
  AnyState,
  GeneralAction,
  ParentState,
  Reducer,
  ReducerMap,
  Selector,
} from './internalTypes';
import type { AnyAction } from 'redux';

const slice = Array.prototype.slice;

export default class Slice<Name extends string, State extends AnyState> {
  private __h: Record<string, Reducer<State>> | null;
  private __r: Reducer<State> | null;
  private __s: State;

  initialState: Readonly<State>;
  name: Name;

  constructor(name: Name, initialState: State = {} as State) {
    // Bind all methods to the instance to ensure destructured use works as expected.
    this.createAction = this.createAction.bind(this);
    this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
    this.createSelector = this.createSelector.bind(this);
    this.reducer = this.reducer.bind(this);
    this.setReducer = this.setReducer.bind(this);

    this.__h = null;
    // Provide placeholder reducer for slices that don't have any handlers.
    this.__r = () => initialState;
    this.__s = initialState;

    this.initialState = initialState as Readonly<State>;
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
  createAction<Type extends string, PayloadCreator, MetaCreator>(
    unscopedType: Type,
    getPayload?: PayloadCreator,
    getMeta?: MetaCreator,
  ) {
    const type = `${this.name}/${unscopedType}` as const;

    let actionCreator: any;

    // Below the use of `.apply(null, arguments)` is used instead of `(...args)` to avoid the runtime cost
    // of unnecessarily converting the arguments into an array. They are simply passed through, so no need
    // to shallowly clone them.

    if (typeof getPayload === 'function') {
      if (typeof getMeta === 'function') {
        actionCreator = function () {
          return applyErrorToAction({
            payload: getPayload.apply(null, arguments),
            meta: getMeta.apply(null, arguments),
            type,
          });
        };
      } else {
        actionCreator = function () {
          return applyErrorToAction({
            payload: getPayload.apply(null, arguments),
            type,
          });
        };
      }
    } else if (typeof getMeta === 'function') {
      actionCreator = function () {
        return {
          meta: getMeta.apply(null, arguments),
          type,
        };
      };
    } else {
      actionCreator = function () {
        return { type };
      };
    }

    // Set as frozen property to avoid accidental overwrites, but also prevent enumeration.
    Object.defineProperty(actionCreator, 'type', {
      configurable: false,
      enumerable: false,
      value: type,
      writable: false,
    });

    return actionCreator as ActionCreator<
      typeof type,
      PayloadCreator,
      MetaCreator
    > & { type: typeof type };
  }

  /**
   * Create a selector specific to the slice state that is memoized based on the arguments passed.
   *
   * @param selector - slice-specific selector function
   * @param isEqual - method to determine equality of arguments passed to the selector
   * @returns - result of calling the selector
   */
  createMemoizedSelector<Args extends unknown[], Result extends any>(
    selector: (state: State, ...args: Args) => Result,
    isEqual = isStrictlyEqual,
  ) {
    const name = this.name;

    let prevState: State;
    let prevArgs = [] as unknown as Args;
    let prevResult: Result;

    const memoizedSelector = function (state: ParentState<Name, State>) {
      // Leveraging `slice.call(arguments)` to avoid inline for loop.
      const remainingArgs = slice.call(arguments, 1) as Args;
      const nextState = state[name];

      if (
        !prevState ||
        prevState !== nextState ||
        remainingArgs.length !== prevArgs.length ||
        some(remainingArgs, (arg, index) => isEqual(prevArgs[index], arg))
      ) {
        prevState = nextState;
        prevArgs = remainingArgs;
        prevResult = selector(nextState, ...remainingArgs);
      }

      return prevResult;
    } as unknown as Selector<Name, State, Args, Result> & { clear: () => void };

    memoizedSelector.clear = () => {
      prevState = undefined as unknown as State;
      prevArgs = [] as unknown as Args;
      prevResult = undefined as unknown as Result;
    };

    return memoizedSelector;
  }

  /**
   * Create a selector that is specific to the slice state.
   *
   * @param selector - slice-specific selector function
   * @returns - result of calling the selector
   */
  createSelector<Args extends unknown[], Result extends any>(
    selector: (state: State, ...remainingArgs: Args) => Result,
  ) {
    const name = this.name;

    // Simple wrapper that selects from the specific slice of state.
    return function (state: ParentState<Name, State>) {
      // Leveraging `slice.call(arguments)` to avoid inline for loop.
      const remainingArgs = slice.call(arguments, 1) as Args;

      return selector(state[name], ...remainingArgs);
    } as unknown as Selector<Name, State, Args, Result>;
  }

  /**
   * Reducer function that will derive the next state of the slice based on the current state
   * and the action dispatched.
   *
   * @param state - current slice state
   * @param action - dispatched action
   * @returns - next slice state
   */
  reducer<Action extends AnyAction>(
    state: State = this.initialState,
    action: Action,
  ) {
    if (this.__h) {
      const handler = this.__h[action.type];

      // If a handler for the given action exists, then we can call it directly instead of
      // leveraging a wrapping reducer, otherwise we ignore the action and return existing state.
      return handler ? (this.__s = handler(state, action)) : this.__s;
    }

    if (this.__r) {
      // If a functional reducer is used instead of the custom handlers, just call it directly.
      return (this.__s = this.__r(state, action));
    }

    // This should never happen, but it would be a scenario where `setReducer` was explicitly called with `null`.
    throw new Error(
      `No reducer or action handlers were found for \`${this.name}\`.`,
    );
  }

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
  setReducer<
    ActionMap extends Record<string, (...args: any[]) => GeneralAction>,
  >(handler: Reducer<State> | ReducerMap<State, ActionMap>) {
    if (typeof handler === 'function') {
      this.__r = handler;
      this.__h = null;
    } else if (typeof handler === 'object') {
      this.__r = null;
      this.__h = handler;
    } else {
      throw new Error(
        `Handlers passed to \`Slice<${this.name}>.setReducer\` must be either a reducer function or an object of reducers that handle specific action types.`,
      );
    }
  }
}
