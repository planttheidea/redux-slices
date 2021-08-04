import Slice from './Slice';

import type {
  ActionCreator,
  AnyState,
  GeneralAction,
  GeneralActionCreator,
  ParentState,
  Reducer,
  ReducerMap,
  ReduxReducer,
  Selector,
  SliceBuilderSetConfig,
  SliceSelector,
} from './internalTypes';

const slice = Array.prototype.slice;

function applyErrorToAction(action: GeneralAction) {
  if (action.payload instanceof Error) {
    action.error = true;
  }

  return action;
}

/**
 * Are the two values passed strictly equal to one another.
 *
 * @param a - the first value to compare
 * @param b - the second value to compare
 * @returns - are the values passed strictly equal
 */
function isStrictlyEqual(a: any, b: any) {
  return a === b;
}

export default class SliceBuilder<Name extends string, State extends AnyState> {
  readonly initialState: Readonly<State>;
  readonly name: Name;

  constructor(name: Name, initialState: State = {} as State) {
    if (typeof name !== 'string') {
      throw new TypeError(
        `Name provided to \`SliceBuilder\` must be a string; received ${typeof name}.`,
      );
    }

    // Bind all methods to the instance to ensure destructured use works as expected.
    this.createAction = this.createAction.bind(this);
    this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
    this.createReducer = this.createReducer.bind(this);
    this.createSelector = this.createSelector.bind(this);
    this.createSlice = this.createSlice.bind(this);

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
            meta: getMeta.apply(null, arguments),
            payload: getPayload.apply(null, arguments),
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
    Object.defineProperty(actionCreator, 'type', { value: type });

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
    selector: SliceSelector<State, Args, Result>,
    isEqual = isStrictlyEqual,
  ) {
    type CompleteArgs = [State, ...Args];

    const name = this.name;

    let prevArgs = [] as unknown as CompleteArgs;
    let prevResult: Result;

    return function (state: ParentState<Name, State>) {
      // Leveraging `slice.call(arguments)` to avoid inline for loop.
      const args = slice.call(arguments, 0) as CompleteArgs;
      const size = args.length;

      args[0] = state[name];

      let shouldUpdate = size !== prevArgs.length;

      if (!shouldUpdate) {
        for (let index = 0; index < size; ++index) {
          if (!isEqual(args[index], prevArgs[index])) {
            shouldUpdate = true;
            break;
          }
        }
      }

      if (shouldUpdate) {
        prevArgs = args;
        prevResult = selector.apply(null, args);
      }

      return prevResult;
    } as unknown as Selector<Name, State, Args, Result>;
  }

  createReducer<ActionMap extends Record<string, GeneralActionCreator>>(
    handler: Reducer<State, GeneralAction> | ReducerMap<State, ActionMap>,
  ) {
    const initialState = this.initialState;

    if (typeof handler === 'function') {
      return <Action extends GeneralAction>(
        state: State | undefined,
        action: Action,
      ) => handler(state || initialState, action);
    }

    if (typeof handler === 'object' && handler !== null) {
      // We store the current state internally to allow short-circuiting with specific action type
      // handlers. By default, all reducers are called when an action is dispatched, so in a case
      // where an action our reducer ignores is dispatched we simply return the current state.
      let currentState: State = initialState;

      return <Action extends ReturnType<ActionMap[string]>>(
        state: State | undefined,
        action: Action,
      ) => {
        const updater = handler[action.type];

        return updater
          ? (currentState = updater(state || initialState, action))
          : currentState;
      };
    }

    throw new Error(
      `Handlers passed to \`SliceBuilder<${this.name}>.setReducer\` must be either a reducer function or an object of action-specific reducers.`,
    );
  }

  /**
   * Create a selector that is specific to the slice state.
   *
   * @param selector - slice-specific selector function
   * @returns - result of calling the selector
   */
  createSelector<Args extends unknown[], Result extends any>(
    selector: SliceSelector<State, Args, Result>,
  ) {
    type CompleteArgs = [State, ...Args];

    const name = this.name;

    // Simple wrapper that selects from the specific slice of state.
    return function (state: ParentState<Name, State>) {
      // Leveraging `slice.call(arguments)` to avoid inline for loop.
      const args = slice.call(arguments, 0) as CompleteArgs;

      args[0] = state[name];

      return selector.apply(null, args);
    } as unknown as Selector<Name, State, Args, Result>;
  }

  createSlice<
    ReducerHandler extends ReduxReducer<State, GeneralAction>,
    ActionCreators extends Record<string, GeneralActionCreator>,
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
    const initialState = this.initialState;

    return new Slice<Name, State, ReducerHandler, ActionCreators, Selectors>({
      actionCreators,
      name: this.name,
      reducer: reducer || ((() => initialState) as unknown as ReducerHandler),
      selectors,
    });
  }
}
