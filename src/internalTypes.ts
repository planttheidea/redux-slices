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

export type GeneralAction = Partial<{
  error: true;
  meta: any;
  payload: any;
  type: string;
}>;

export type ParentState<SliceName extends string, State extends any> = Record<
  string,
  any
> &
  { [Key in SliceName]: State };

export type Reducer<State extends AnyState, Action extends any = any> = ((
  state: State,
  action: Action,
) => State) & {
  __keys?: string[];
};

export type ReducerMap<
  State extends AnyState,
  ActionMap extends Record<string, (...args: any) => GeneralAction>,
> = {
  [Type in keyof ActionMap]: Reducer<State, ReturnType<ActionMap[Type]>>;
};
