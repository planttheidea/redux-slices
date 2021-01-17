/* eslint-disable guard-for-in, no-redeclare, no-restricted-syntax, no-confusing-arrow, implicit-arrow-linebreak, prefer-spread */

type AnyState = Record<string, any>;

type Action<Payload extends any, Meta extends any> = Payload extends undefined
  ? Meta extends undefined
    ? { type: string }
    : { meta: Meta; type: string }
  : Meta extends undefined
  ? { payload: Payload; type: string }
  : { meta: Meta; payload: Payload; type: string };

type ActionCreator<
  Payload extends any,
  Meta extends any,
  Args extends any[]
> = (...args: Args) => Action<Payload, Meta>;

type PayloadCreator<Payload extends any, Args extends any[]> = (
  ...args: Args
) => Payload;
type MetaCreator<Meta extends any, Args extends any[]> = (
  ...args: Args
) => Meta;

type ParentState<SliceName extends string, State extends AnyState> = Record<
  string,
  AnyState
> &
  { [Key in SliceName]: State };

export type Reducer<State extends AnyState> = (
  state: State,
  action: any
) => State;

function createActionCreator<
  Payload extends any = undefined,
  Meta extends any = undefined,
  Args extends any[] = any[]
>(type: string): (arg?: Args[0]) => Action<Args[0], undefined>;
function createActionCreator<
  Payload extends any = undefined,
  Meta extends any = undefined,
  Args extends any[] = any[]
>(
  type: string,
  payloadCreator: PayloadCreator<Payload, Args>
): ActionCreator<Payload, undefined, Args>;
function createActionCreator<
  Payload extends any = undefined,
  Meta extends any = undefined,
  Args extends any[] = any[]
>(
  type: string,
  payloadCreator: null | undefined,
  metaCreator: MetaCreator<Meta, Args>
): ActionCreator<undefined, Meta, Args>;
function createActionCreator<
  Payload extends any = undefined,
  Meta extends any = undefined,
  Args extends any[] = any[]
>(
  type: string,
  payloadCreator: PayloadCreator<Payload, Args>,
  metaCreator: MetaCreator<Meta, Args>
): ActionCreator<Payload, Meta, Args>;
function createActionCreator<
  Payload extends any = undefined,
  Meta extends any = undefined,
  Args extends any[] = any[]
>(
  type: string,
  payloadCreator?: PayloadCreator<Payload, Args> | null | undefined,
  metaCreator?: MetaCreator<Meta, Args> | undefined
) {
  if (payloadCreator && metaCreator) {
    return (...args: Args) => ({
      meta: metaCreator(...args),
      payload: payloadCreator(...args),
      type,
    });
  }

  if (payloadCreator) {
    return (...args: Args) => ({
      payload: payloadCreator(...args),
      type,
    });
  }

  if (metaCreator) {
    return (...args: Args) => ({
      meta: metaCreator(...args),
      type,
    });
  }

  return (arg?: Args[0]) =>
    arg === undefined ? { type } : { payload: arg, type };
}

function isStrictlyEqual(prev: any, next: any) {
  return prev === next;
}

const RESET_SLICE_NAME = 'reset';

function createSlice<SliceName extends string, State extends AnyState>(
  name: SliceName,
  initialState: State = {} as State
) {
  if (!name || typeof name !== 'string') {
    throw new Error('Slices can only be named with string values.');
  }

  if (
    !initialState ||
    typeof initialState !== 'object' ||
    Array.isArray(initialState)
  ) {
    throw new TypeError(
      `The initial state for ${name} must be an object; received ${
        Array.isArray(initialState) ? 'array' : typeof initialState
      }.`
    );
  }

  const resetName = `${name}/${RESET_SLICE_NAME}`;

  function reset() {
    return { type: resetName };
  }

  const actionCreators: Record<
    string,
    ReturnType<typeof createActionCreator>
  > = {
    reset: reset as ActionCreator<unknown, unknown, []>,
  };
  const actionHandlers: Record<string, Reducer<State>> = {
    [resetName]: () => initialState,
  };
  const actionTypes: Record<string, string> = {
    reset: resetName,
  };

  let reduce: Reducer<State> = () => initialState;

  function createAction<
    Payload extends any = undefined,
    Meta extends any = undefined,
    Args extends any[] = any[]
  >(
    unscopedType: string,
    getPayload?: null | undefined | PayloadCreator<Payload, Args>,
    getMeta?: MetaCreator<Meta, Args>
  ) {
    if (unscopedType === RESET_SLICE_NAME) {
      throw new Error(
        `"${unscopedType}" is a reserved action type. Please rename the custom action for "${name}".`
      );
    }

    if (getPayload && typeof getPayload !== 'function') {
      throw new Error(
        `Payload creator for "${unscopedType}" in "${name}" must be a function.`
      );
    }

    if (getMeta && typeof getMeta !== 'function') {
      throw new Error(
        `Meta creator for "${unscopedType}" in "${name}" must be a function.`
      );
    }

    const type = `${name}/${unscopedType}`;

    const actionCreator = createActionCreator<Payload, Meta>(
      type,
      getPayload,
      getMeta
    ) as ActionCreator<Payload, Meta, Args> & { type: string };

    actionCreator.type = type;

    Object.defineProperty(actionCreator, 'toString', {
      configurable: true,
      enumerable: false,
      value: () => type,
      writable: true,
    });

    actionCreators[type] = actionCreator;
    actionTypes[type] = type;

    return actionCreator;
  }

  function createSelector<Args extends unknown[], Result>(
    selector: (state: State, ...args: Args) => Result
  ) {
    return (state: ParentState<SliceName, State>, ...args: Args) =>
      selector.apply(null, [].concat(state[name], args));
  }

  function createMemoizedSelector<Args extends unknown[], Result>(
    selector: (state: State, ...args: Args) => Result,
    isEqual = isStrictlyEqual
  ) {
    let prevSlice: State;
    let prevArgs = [] as Args;
    let prevResult: Result;

    return (state: ParentState<SliceName, State>, ...args: Args) => {
      const slice = state[name];

      if (
        !prevSlice ||
        args.length !== prevArgs.length ||
        !isEqual(prevSlice, slice) ||
        args.some((arg, index) => isEqual(prevArgs[index], arg))
      ) {
        prevSlice = slice;
        prevArgs = args;
        prevResult = selector.apply(null, [].concat(slice, args));
      }

      return prevResult;
    };
  }

  function getState(state: ParentState<SliceName, State>) {
    return state[name];
  }

  function handle(handlers: Reducer<State> | Record<string, Reducer<State>>) {
    if (typeof handlers === 'function') {
      reduce = (state = initialState, action) => {
        if (action.type === resetName) {
          return initialState;
        }

        return handlers(state, action);
      };
    } else if (handlers && typeof handlers === 'object') {
      for (const key in handlers) {
        actionHandlers[key] = handlers[key];
      }

      reduce = (state = initialState, action) => {
        const { type } = action;

        if (!actionHandlers[type]) {
          return state;
        }

        const reducer = actionHandlers[type];

        return reducer ? reducer(state, action) : state;
      };
    } else {
      throw new Error(
        `Handlers passed to \`slice<${name}>.handle\` must be either a reducer or an object of actionHandlers mapping to objects.`
      );
    }

    return reduce;
  }

  return {
    // Leverage a getter to allow updates to `reduce`.
    get reduce() {
      return reduce;
    },

    actionCreators,
    actionHandlers,
    createAction,
    createMemoizedSelector,
    createSelector,
    getState,
    handle,
    name,
    reset,
  } as const;
}

export default createSlice;
