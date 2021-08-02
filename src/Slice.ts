import { addToString, isStrictlyEqual, some } from './utils';

import type {
  ActionCreator,
  AnyState,
  ParentState,
  Reducer,
} from './internalTypes';

export default class Slice<Name extends string, State extends AnyState> {
  __handledTypes: Record<string, Reducer<State>> | null;
  __reducer: Reducer<State> | null;
  __state: State;

  actionCreators: Record<string, ActionCreator<string, any, any>>;
  initialState: State;
  name: Name;

  constructor(name: Name, initialState: State) {
    this.createAction = this.createAction.bind(this);
    this.createMemoizedSelector = this.createMemoizedSelector.bind(this);
    this.createSelector = this.createSelector.bind(this);
    this.getState = this.getState.bind(this);
    this.reducer = this.reducer.bind(this);
    this.setReducer = this.setReducer.bind(this);

    this.__handledTypes = null;
    this.__reducer = () => initialState;
    this.__state = initialState;

    this.actionCreators = {};
    this.initialState = initialState;
    this.name = name;
  }

  createAction<
    Type extends string,
    Args extends unknown[],
    PayloadCreator,
    MetaCreator,
  >(unscopedType: Type, getPayload?: PayloadCreator, getMeta?: MetaCreator) {
    const type = `${this.name}/${unscopedType}` as const;

    if (this.actionCreators[type]) {
      throw new ReferenceError(
        `An action creator for \`${type}\` already exists for \`${this.name}\`.`,
      );
    }

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

    actionCreator = addToString(
      type,
      actionCreator as ActionCreator<
        `${Name}/${Type}`,
        PayloadCreator,
        MetaCreator
      >,
    );

    this.actionCreators[type] = actionCreator;

    return actionCreator;
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

  getState() {
    return this.__state;
  }

  reducer(state: State, action: any) {
    if (!state) {
      state = this.__state;
    }

    if (this.__handledTypes) {
      const handler = this.__handledTypes[action.type];

      if (handler) {
        this.__state = handler(state, action);
      }

      return this.__state;
    }

    return (this.__reducer as Reducer<State>)(state, action);
  }

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
