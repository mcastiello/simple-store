import {
  ActionOf,
  ActionsDefinitions,
  GenericState,
  Reducer,
  Store,
  StoreDispatcher,
  StoreIntercept,
  StoreSubscribe,
} from "./types";
import { CancellablePromise } from "@mcastiello/cancellable-promise";

export const createStore = <State extends GenericState, Definitions extends ActionsDefinitions<keyof Definitions>>(
  reducer: Reducer<State, Definitions>,
  initialState?: State,
): Store<State, Definitions> => {
  let currentState = initialState;
  const subscriptions: Map<string, Parameters<StoreSubscribe<State, Definitions>>> = new Map();
  const interceptors: Map<string, Parameters<StoreIntercept<State, Definitions>>> = new Map();

  const subscribe: StoreSubscribe<State, Definitions> = (subscription, actions = []) => {
    const id = crypto.randomUUID();
    const deferredSubscription = CancellablePromise.defer(subscription);
    subscriptions.set(id, [deferredSubscription, actions]);

    if (currentState && actions.length === 0) {
      subscription(currentState);
    }

    return () => {
      subscriptions.delete(id);
    };
  };

  const intercept: StoreIntercept<State, Definitions> = (interceptor, actions) => {
    const id = crypto.randomUUID();
    interceptors.set(id, [interceptor, actions]);

    return () => {
      interceptors.delete(id);
    };
  };

  const dispatch: StoreDispatcher<Definitions> = (...args) => {
    const [type, payload] = args;
    const action = { type, payload } as ActionOf<Definitions, keyof Definitions>;
    const reducedState = reducer(currentState, action);

    const affectedSubscriptions = Array.from(subscriptions.values())
      .filter(([, actions]) => {
        return actions?.length === 0 || actions?.includes(type);
      })
      .map(([subscription]) => subscription);

    const affectedInterceptors = Array.from(interceptors.values())
      .filter(([, actions]) => {
        return actions.includes(type);
      })
      .map(([interceptor]) => interceptor);

    const newState = affectedInterceptors.reduce(
      (state, interceptor) => interceptor(currentState, state, action),
      reducedState,
    );

    // Comparison is done by reference. While interceptors will always get executed,
    // subscriptions will only run if the state reference has been modified.
    if (currentState !== newState) {
      affectedSubscriptions.forEach((subscription) => subscription(newState, action));

      currentState = newState;
    }
  };

  const state: State = new Proxy<State>({} as State, {
    get(_, property) {
      return currentState?.[property as keyof State];
    },
  });

  return { subscribe, intercept, dispatch, state } as const;
};
