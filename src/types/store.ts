import { ActionOf, ActionParameters, ActionsDefinitions } from "./actions";

export type GenericState = {
  [Prop in string]: unknown;
};

export type Reducer<State extends GenericState, Definitions extends ActionsDefinitions<keyof Definitions>> = (
  state: State | undefined,
  action: ActionOf<Definitions, keyof Definitions>,
) => State;

export type StoreSubscription<State extends GenericState, Definitions extends ActionsDefinitions<keyof Definitions>> = <
  ActionType extends keyof Definitions,
>(
  state: State,
  action: ActionOf<Definitions, ActionType>,
) => void | PromiseLike<void>;

export type StoreInterceptor<State extends GenericState, Definitions extends ActionsDefinitions<keyof Definitions>> = <
  ActionType extends keyof Definitions,
>(
  oldState: State | undefined,
  newState: State,
  action: ActionOf<Definitions, ActionType>,
) => State;

export type StoreSubscribe<State extends GenericState, Definitions extends ActionsDefinitions<keyof Definitions>> = (
  subscription: StoreSubscription<State, Definitions>,
  actions?: (keyof Definitions)[],
) => () => void;

export type StoreIntercept<State extends GenericState, Definitions extends ActionsDefinitions<keyof Definitions>> = (
  interceptor: StoreInterceptor<State, Definitions>,
  actions: (keyof Definitions)[],
) => () => void;

export type StoreDispatcher<Definitions extends ActionsDefinitions<keyof Definitions>> = <
  ActionType extends keyof Definitions,
>(
  ...args: ActionParameters<Definitions, ActionType>
) => void;

export type Store<State extends GenericState, Definitions extends ActionsDefinitions<keyof Definitions>> = {
  subscribe: StoreSubscribe<State, Definitions>;
  intercept: StoreIntercept<State, Definitions>;
  dispatch: StoreDispatcher<Definitions>;
};
