import type { Tuple } from 'ts-toolbelt';

export type AnyState = { [key: string]: any };

export type ActionCreator<
  Type extends string,
  PayloadCreator,
  MetaCreator,
> = (PayloadCreator extends (...args: any[]) => any
  ? MetaCreator extends (...args: any[]) => any
    ? (
        ...args: Tuple.Longest<
          Parameters<PayloadCreator>,
          Parameters<MetaCreator>
        >
      ) => {
        meta: ReturnType<MetaCreator>;
        payload: ReturnType<PayloadCreator>;
        type: Type;
      }
    : (...args: Parameters<PayloadCreator>) => {
        payload: ReturnType<PayloadCreator>;
        type: Type;
      }
  : MetaCreator extends (...args: any[]) => any
  ? (...args: Parameters<MetaCreator>) => {
      meta: ReturnType<MetaCreator>;
      type: Type;
    }
  : <Payload extends any>(
      payload?: Payload,
    ) => { payload: Payload; type: Type }) & { type: Type };

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
