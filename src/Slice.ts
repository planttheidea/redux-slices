import type {
  AnyState,
  GeneralAction,
  GeneralActionCreator,
  Reducer,
  Selector,
  SliceConfig,
} from './internalTypes';

export default class Slice<
  Name extends string,
  State extends AnyState,
  ReducerHandler extends Reducer<State, GeneralAction>,
  ActionCreators extends Record<string, GeneralActionCreator>,
  Selectors extends Record<string, Selector<Name, State, unknown[], any>>,
> {
  readonly actionCreators: ActionCreators;
  readonly name: Name;
  readonly reducer: ReducerHandler;
  readonly selectors: Selectors;

  constructor({
    actionCreators,
    name,
    reducer,
    selectors,
  }: SliceConfig<Name, State, ReducerHandler, ActionCreators, Selectors>) {
    this.actionCreators = actionCreators || ({} as ActionCreators);
    this.name = name;
    this.reducer = reducer;
    this.selectors = selectors || ({} as Selectors);

    Object.freeze(this);
  }
}
