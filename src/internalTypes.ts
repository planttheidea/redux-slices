import type { Reducer as ReduxReducer } from 'redux';
import type { Tuple } from 'ts-toolbelt';

export type AnyState = { [key: string]: any };

type FluxStandardAction<Type, Payload, Meta> = Payload extends undefined
  ? Meta extends undefined
    ? { type: Type }
    : { meta: Meta; type: Type }
  : Meta extends undefined
  ? Payload extends Error
    ? { error: true; payload: Payload; type: Type }
    : { payload: Payload; type: Type }
  : Payload extends Error
  ? { error: true; meta: Meta; payload: Payload; type: Type }
  : { meta: Meta; payload: Payload; type: Type };

export type ActionCreator<
  Type extends string,
  PayloadCreator,
  MetaCreator,
> = PayloadCreator extends (...args: any[]) => any
  ? MetaCreator extends (...args: any[]) => any
    ? (
        ...args: Tuple.Longest<
          Parameters<PayloadCreator>,
          Parameters<MetaCreator>
        >
      ) => FluxStandardAction<
        Type,
        ReturnType<PayloadCreator>,
        ReturnType<MetaCreator>
      >
    : (
        ...args: Parameters<PayloadCreator>
      ) => FluxStandardAction<Type, ReturnType<PayloadCreator>, undefined>
  : MetaCreator extends (...args: any[]) => any
  ? (
      ...args: Parameters<MetaCreator>
    ) => FluxStandardAction<Type, undefined, ReturnType<MetaCreator>>
  : () => FluxStandardAction<Type, undefined, undefined>;

export type GeneralAction = {
  error?: true;
  meta?: any;
  payload?: any;
  type: string;
};

export type GeneralActionCreator = (...args: any[]) => GeneralAction;

export type ParentState<SliceName extends string, State extends any> = Record<
  string,
  any
> &
  { [Key in SliceName]: State };

export type Reducer<State extends AnyState, Action extends GeneralAction> = (
  state: State,
  action: Action,
) => State;

export type { ReduxReducer };

export type ReducerMap<
  State extends AnyState,
  ActionMap extends Record<string, GeneralActionCreator>,
> = {
  [Type in keyof ActionMap]: Reducer<State, ReturnType<ActionMap[Type]>>;
};

export type Selector<
  Name extends string,
  State extends AnyState,
  Args extends unknown[],
  Result extends any,
> = (state: ParentState<Name, State>, ...remainingArgs: Args) => Result;

export type SliceConfig<
  Name extends string,
  State extends AnyState,
  ReducerHandler extends Reducer<State, GeneralAction>,
  ActionCreators extends Record<string, GeneralActionCreator>,
  Selectors extends Record<string, Selector<Name, State, unknown[], any>>,
> = {
  name: Name;
  reducer: ReducerHandler;
  actionCreators?: ActionCreators;
  selectors?: Selectors;
};

export type SliceSelector<
  State extends AnyState,
  Args extends unknown[],
  Result extends any,
> = (state: State, ...remainingArgs: Args) => Result;

export type SliceBuilderSetConfig<
  Name extends string,
  State extends AnyState,
  ReducerHandler extends ReduxReducer<State, GeneralAction>,
  ActionCreators extends Record<string, GeneralActionCreator>,
  Selectors extends Record<string, Selector<Name, State, unknown[], any>>,
> = Omit<
  SliceConfig<Name, State, ReducerHandler, ActionCreators, Selectors>,
  'name' | 'reducer'
> & { reducer?: ReducerHandler };
