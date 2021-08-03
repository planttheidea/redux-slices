import Slice from './Slice';
import { applyErrorToAction, isStrictlyEqual, some } from './utils';

import type {
  ActionCreator,
  AnyState,
  GeneralAction,
  ParentState,
  Reducer,
  ReducerMap,
  Selector,
  SliceBuilderSetConfig,
} from './internalTypes';

const slice = Array.prototype.slice;

export default class SliceBuilder<Name extends string, State extends AnyState> {
  readonly initialState: Readonly<State>;
  readonly name: Name;

  constructor(name: Name, initialState: State = {} as State) {
    // Bind all methods to the instance to ensure destructured use works as expected.
    this.createAction = this.createAction.bind(this);
    this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
    this.createReducer = this.createReducer.bind(this);
    this.createSelector = this.createSelector.bind(this);
    this.set = this.set.bind(this);

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

  createReducer<
    ActionMap extends Record<string, (...args: any[]) => GeneralAction>,
  >(handler: Reducer<State, GeneralAction> | ReducerMap<State, ActionMap>) {
    const initialState = this.initialState;

    if (typeof handler === 'function') {
      return <Action extends GeneralAction>(state: State, action: Action) =>
        handler(state || initialState, action);
    }

    if (typeof handler === 'object') {
      // We store the current state internally to allow short-circuiting with specific action type
      // handlers. By default, all reducers are called when an action is dispatched, so in a case
      // where an action our reducer ignores is dispatched we simply return the current state.
      let currentState: State = initialState;

      return <Action extends ReturnType<ActionMap[string]>>(
        state: State,
        action: Action,
      ) => {
        const updater = handler[action.type];

        return updater
          ? (currentState = updater(state || initialState, action))
          : currentState;
      };
    }

    throw new Error(
      `Handlers passed to \`SliceBuilder<${this.name}>.setReducer\` must be either a reducer function or an object of reducers that handle specific action types.`,
    );
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

  set<
    ReducerHandler extends Reducer<State, GeneralAction>,
    ActionCreators extends Record<string, (...args: any[]) => GeneralAction>,
    Selectors extends Record<string, Selector<Name, State, unknown[], any>>,
  >({
    actionCreators,
    reducer,
    selectors,
  }: SliceBuilderSetConfig<
    Name,
    State,
    ReducerHandler,
    ActionCreators,
    Selectors
  >) {
    const name = this.name;
    const initialState = this.initialState;

    return new Slice<Name, State, ReducerHandler, ActionCreators, Selectors>({
      actionCreators,
      name,
      reducer: reducer || (() => initialState),
      selectors,
    });
  }
}
