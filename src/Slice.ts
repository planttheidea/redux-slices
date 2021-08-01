import { addToString, isStrictlyEqual, some } from './utils';

import type {
  ActionCreator,
  AnyState,
  ParentState,
  Reducer,
} from './internalTypes';

export default class Slice<Name extends string, State extends AnyState> {
  __handledTypes: Record<string, true> | null;
  __initialState: State;
  __reducer: Reducer<State>;
  __resetName: `${Name}/reset`;
  __state: State;

  name: Name;
  reset: () => { type: `${Name}/reset` };

  constructor(name: Name, initialState: State) {
    this.createAction = this.createAction.bind(this);
    this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
    this.createSelector = this.createSelector.bind(this);
    this.getState = this.getState.bind(this);
    this.reduce = this.reduce.bind(this);
    this.setReducer = this.setReducer.bind(this);

    this.__handledTypes = null;
    this.__reducer = this.setReducer(() => initialState);
    this.__resetName = `${name}/reset`;
    this.__state = this.__initialState = initialState;

    this.name = name;
    this.reset = () => ({ type: this.__resetName });
  }

  createAction<
    Type extends string,
    Args extends unknown[],
    PayloadCreator,
    MetaCreator,
  >(unscopedType: Type, getPayload?: PayloadCreator, getMeta?: MetaCreator) {
    if (unscopedType === 'reset') {
      // @ts-ignore - intentionally overriding resetName
      this.resetName = '@@redux-slice/default-reset-action-overridden';

      Object.defineProperty(this, 'reset', {
        get() {
          throw new Error(
            `The built-in \`reset\` action has been overridden for \`${this.name}\`.`,
          );
        },
      });
    }

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

    return addToString(
      type,
      actionCreator as ActionCreator<
        `${Name}/${Type}`,
        PayloadCreator,
        MetaCreator
      >,
    );
  }

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
        prevResult = selector(state[this.name], ...args);
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

  createSelector<Args extends unknown[], Returns extends any>(
    selector: (state: State, ...remainingArgs: Args) => Returns,
  ) {
    return (state: ParentState<Name, State>, ...remainingArgs: Args) =>
      selector(state[this.name], ...remainingArgs);
  }

  getState(state: ParentState<Name, State>) {
    return state[this.name];
  }

  reduce(state: State, action: any) {
    if (!state) {
      state = this.__state;
    }

    if (this.__handledTypes) {
      if (this.__handledTypes[action.type]) {
        this.__state = this.__reducer(state, action);
      }

      return this.__state;
    }

    return this.__reducer(state, action);
  }

  setReducer(handler: Reducer<State> | Record<string, Reducer<State>>) {
    if (typeof handler === 'function') {
      this.__reducer = (state: State, action: any) => {
        if (action.type === this.__resetName) {
          return this.__initialState;
        }

        return (handler as Reducer<State>)(state, action);
      };

      this.__handledTypes = null;
    } else if (typeof handler === 'object') {
      this.__reducer = (state: State, action: any) => {
        if (action.type === this.__resetName) {
          return this.__initialState;
        }

        const updater = handler[action.type];

        return updater ? { ...state, ...updater(state, action) } : state;
      };

      this.__handledTypes = [this.__resetName, ...Object.keys(handler)].reduce<
        Record<string, true>
      >((booleanMap, key) => {
        booleanMap[key] = true;

        return booleanMap;
      }, {});
    } else {
      throw new Error(
        `Handlers passed to \`Slice<${this.name}>.setReducer\` must be either a reducer function or an object of reducers that handle specific action types.`,
      );
    }

    return this.__reducer;
  }
}
