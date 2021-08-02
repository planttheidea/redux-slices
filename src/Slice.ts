import { isStrictlyEqual, some } from './utils';

import type {
  ActionCreator,
  AnyState,
  ParentState,
  Reducer,
} from './internalTypes';
import type { AnyAction } from 'redux';

export default class Slice<Name extends string, State extends AnyState> {
  __handledTypes: Record<string, Reducer<State>> | null;
  __reducer: Reducer<State> | null;
  __state: State;

  initialState: State;
  name: Name;

  constructor(name: Name, initialState: State = {} as State) {
    // Bind all methods to the instance to ensure destructured use works as expected.
    this.createAction = this.createAction.bind(this);
    this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
    this.createSelector = this.createSelector.bind(this);
    this.getState = this.getState.bind(this);
    this.reducer = this.reducer.bind(this);
    this.setReducer = this.setReducer.bind(this);

    this.__handledTypes = null;
    // Provide placeholder reducer for slices that don't have any handlers.
    this.__reducer = () => initialState;
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
  createAction<
    Type extends string,
    Args extends unknown[],
    PayloadCreator,
    MetaCreator,
  >(unscopedType: Type, getPayload?: PayloadCreator, getMeta?: MetaCreator) {
    const type = `${this.name}/${unscopedType}` as const;

    let actionCreator: any;

    if (typeof getPayload === 'function' && typeof getMeta === 'function') {
      actionCreator = (...args: Args) => ({
        payload: getPayload(...args),
        meta: getMeta(...args),
        type,
      });
    } else if (typeof getPayload === 'function') {
      actionCreator = (...args: Args) => ({
        payload: getPayload(...args),
        type,
      });
    } else if (typeof getMeta === 'function') {
      actionCreator = (...args: Args) => ({ meta: getMeta(...args), type });
    } else {
      actionCreator = (payload?: Args[0]) => ({ payload, type });
    }

    Object.defineProperty(actionCreator, 'type', {
      configurable: true,
      enumerable: false,
      value: type,
      writable: true,
    });

    return actionCreator as ActionCreator<
      `${Name}/${Type}`,
      PayloadCreator,
      MetaCreator
    >;
  }

  /**
   * Create a selector specific to the slice state that is memoized based on the arguments passed.
   *
   * @param selector - slice-specific selector function
   * @param isEqual - method to determine equality of arguments passed to the selector
   * @returns - result of calling the selector
   */
  createMemoizedSelector<Args extends unknown[], Result>(
    selector: (state: State, ...args: Args) => Result,
    isEqual = isStrictlyEqual,
  ) {
    let prevState: State;
    let prevArgs = [] as unknown as Args;
    let prevResult: Result;

    const memoizedSelector = (
      state: ParentState<Name, State>,
      ...args: Args
    ) => {
      const nextState = state[this.name];

      if (
        !prevState ||
        prevState !== nextState ||
        args.length !== prevArgs.length ||
        some(args, (arg, index) => isEqual(prevArgs[index], arg))
      ) {
        prevState = nextState;
        prevArgs = args;
        prevResult = selector(nextState, ...args);
      }

      return prevResult;
    };

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
  createSelector<Args extends unknown[], Returns extends any>(
    selector: (state: State, ...remainingArgs: Args) => Returns,
  ) {
    // Simple wrapper that selects from the specific slice of state.
    return (state: ParentState<Name, State>, ...remainingArgs: Args) =>
      selector(state[this.name], ...remainingArgs);
  }

  /**
   * Get the current state of the slice
   *
   * @returns - current state of the slice
   */
  getState() {
    return this.__state;
  }

  /**
   * Reducer function that will derive the next state of the slice based on the current state
   * and the action dispatched.
   *
   * @param state - current slice state
   * @param action - dispatched action
   * @returns - next slice state
   */
  reducer<Action extends AnyAction>(state: State, action: Action) {
    if (!state) {
      state = this.__state;
    }

    if (this.__handledTypes) {
      const handler = this.__handledTypes[action.type];

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
  setReducer(handler: Reducer<State> | Record<string, Reducer<State>>) {
    if (typeof handler === 'function') {
      this.__reducer = handler;
      this.__handledTypes = null;
    } else if (typeof handler === 'object') {
      this.__reducer = null;
      this.__handledTypes = handler;
    } else {
      throw new Error(
        `Handlers passed to \`Slice<${this.name}>.setReducer\` must be either a reducer function or an object of reducers that handle specific action types.`,
      );
    }
  }
}
