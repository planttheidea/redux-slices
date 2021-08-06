import type {
  ActionCreator,
  AnyState,
  GeneralAction,
  GeneralActionCreator,
  ParentState,
  Reducer,
  ReducerMap,
  Selector,
  SliceSelector,
} from './internalTypes';

const slice = Array.prototype.slice;

/**
 * Apply the `error: true` property to the action passed if the `payload` is
 * an instance of an `Error`.
 *
 * @param action the action to possibly augment
 * @returns the action passed
 */
function applyErrorToAction(action: GeneralAction) {
  if (action.payload instanceof Error) {
    action.error = true;
  }

  return action;
}

/**
 * Are the two values passed strictly equal to one another.
 *
 * @param a the first value to compare
 * @param b the second value to compare
 * @returns are the values passed strictly equal
 */
function isStrictlyEqual(a: any, b: any) {
  return a === b;
}

/**
 * Determine whether the argument arrays passed are equal in value, based on the `isEqual` method used.
 *
 * @param nextArgs the args being passed now
 * @param prevArgs the previous args passed
 * @param size the size of the arguments (passed explicitly to avoid multiple `.length` requests)
 * @param isEqual method to test equality of the arguments
 * @returns whether the argument arrays are equal
 */
function areArgsEqual(
  nextArgs: any[],
  prevArgs: any[],
  size: number,
  isEqual: typeof isStrictlyEqual,
) {
  for (let index = 0; index < size; ++index) {
    if (!isEqual(nextArgs[index], prevArgs[index])) {
      return true;
    }
  }

  return false;
}

export default class Slice<Name extends string, State extends AnyState> {
  readonly initialState: Readonly<State>;
  readonly name: Name;

  constructor(name: Name, initialState: State = {} as State) {
    if (typeof name !== 'string') {
      throw new TypeError(
        `Name provided to \`Slice\` must be a string; received ${typeof name}.`,
      );
    }

    // Bind all methods to the instance to ensure destructured use works as expected.
    this.createAction = this.createAction.bind(this);
    this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
    this.createReducer = this.createReducer.bind(this);
    this.createSelector = this.createSelector.bind(this);

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
   * @param unscopedType action type
   * @param getPayload optional handler to get the value used for the `payload` property
   * @param getMeta optional handler to get the value used for the `meta` property`
   * @returns action creator, specific to the payload and meta expected
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
   * @param selector slice-specific selector function
   * @param isEqual method to determine equality of arguments passed to the selector
   * @returns result of calling the selector
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
      const nextArgs = slice.call(arguments, 0) as CompleteArgs;

      nextArgs[0] = state[name];

      const size = nextArgs.length;

      if (
        size !== prevArgs.length ||
        areArgsEqual(nextArgs, prevArgs, size, isEqual)
      ) {
        prevArgs = nextArgs;
        prevResult = selector.apply(null, nextArgs);
      }

      return prevResult;
    } as unknown as Selector<Name, State, Args, Result>;
  }

  /**
   * Create a reducer method, either based on the method passed itself or a map of action handlers that will
   * handle state updates in a targeted way for the action type.
   *
   * @param handler either the reducer method itself, or a map of action handlers that build a targeted reducer
   * @returns the reducer method used by redux
   */
  createReducer<ActionMap extends Record<string, GeneralActionCreator>>(
    handler: Reducer<State, GeneralAction> | ReducerMap<State, ActionMap>,
  ) {
    const initialState = this.initialState;

    if (typeof handler === 'function') {
      return <Action extends GeneralAction>(
        state: State = initialState,
        action: Action,
      ) => handler(state, action);
    }

    if (typeof handler === 'object' && handler !== null) {
      return <Action extends ReturnType<ActionMap[string]>>(
        state: State = initialState,
        action: Action,
      ) => {
        const updater = handler[action.type];

        return updater ? updater(state, action) : state;
      };
    }

    throw new Error(
      `Handlers passed to \`Slice<${this.name}>.setReducer\` must be either a reducer function or an object of action-specific reducers.`,
    );
  }

  /**
   * Create a selector that is specific to the slice state.
   *
   * @param selector slice-specific selector function
   * @returns result of calling the selector
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
}
