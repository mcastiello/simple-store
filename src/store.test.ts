import { ActionDefinition, Reducer, StoreInterceptor } from "./types";
import { createStore } from "./store";

enum Action {
  Initialise,
  Update,
  Destroy,
}

type Definitions = {
  [Action.Initialise]: ActionDefinition<Action.Initialise, boolean>;
  [Action.Update]: ActionDefinition<Action.Update, string>;
  [Action.Destroy]: ActionDefinition<Action.Destroy, undefined>;
};

type State = {
  init?: boolean;
  value?: string;
};

describe("Store Manager", () => {
  const reducer = jest.fn<ReturnType<Reducer<State, Definitions>>, Parameters<Reducer<State, Definitions>>>(
    (state = {}, action) => {
      switch (action.type) {
        case Action.Initialise:
          return { ...state, init: action.payload };
        case Action.Update:
          return { ...state, value: action.payload };
        case Action.Destroy:
          return {};
      }
    },
  );

  beforeEach(() => {
    reducer.mockClear();
  });

  test("The state should be accessible after it has been modified", () => {
    const state: State = {
      init: false,
    };
    const store = createStore(reducer, state);

    expect(store.state.init).toEqual(false);

    store.dispatch(Action.Initialise, true);

    expect(store.state.init).toEqual(true);

    store.dispatch(Action.Update, "test");

    expect(store.state.value).toEqual("test");
  });

  test("Subscription is called any time an action is dispatched", () => {
    const subscription = jest.fn();
    const store = createStore(reducer);

    const clear = store.subscribe(subscription);

    store.dispatch(Action.Initialise, true);

    expect(subscription).toHaveBeenCalledWith({ init: true }, { type: Action.Initialise, payload: true });

    store.dispatch(Action.Destroy);

    expect(subscription).toHaveBeenCalledWith({}, { type: Action.Destroy });

    subscription.mockClear();
    // Remove the subscription
    clear();

    store.dispatch(Action.Initialise, true);

    expect(subscription).not.toHaveBeenCalled();
  });

  test("Subscription is called immediately with the current state", () => {
    const state: State = {
      init: false,
    };
    const subscription = jest.fn();
    const store = createStore(reducer, state);

    store.subscribe(subscription);

    expect(subscription).toHaveBeenCalledWith(state);
  });

  test("Subscription is called only when the requested action is dispatched", () => {
    const subscription = jest.fn();
    const store = createStore(reducer);

    store.subscribe(subscription, [Action.Update]);

    store.dispatch(Action.Initialise, true);

    expect(subscription).not.toHaveBeenCalled();

    store.dispatch(Action.Update, "test");

    expect(subscription).toHaveBeenCalledWith({ init: true, value: "test" }, { type: Action.Update, payload: "test" });
  });

  test("Interceptors are able to change the state value", () => {
    const subscription = jest.fn();
    const interceptor = jest.fn<
      ReturnType<StoreInterceptor<State, Definitions>>,
      Parameters<StoreInterceptor<State, Definitions>>
    >((oldState, newState, action) => {
      switch (action.type) {
        case Action.Update:
          return { ...newState, value: `Intercepted: ${newState.value}` };
        default:
          return newState;
      }
    });
    const store = createStore(reducer);

    store.subscribe(subscription);
    const clear = store.intercept(interceptor, [Action.Update]);

    store.dispatch(Action.Initialise, true);

    expect(interceptor).not.toHaveBeenCalled();

    store.dispatch(Action.Update, "test");

    expect(interceptor).toHaveBeenCalledWith(
      { init: true },
      { init: true, value: "test" },
      { type: Action.Update, payload: "test" },
    );

    expect(subscription).toHaveBeenCalledWith(
      { init: true, value: "Intercepted: test" },
      { type: Action.Update, payload: "test" },
    );

    interceptor.mockClear();
    // Remove the interceptor
    clear();

    store.dispatch(Action.Update, "test");

    expect(interceptor).not.toHaveBeenCalled();

    expect(subscription).toHaveBeenCalledWith({ init: true, value: "test" }, { type: Action.Update, payload: "test" });
  });
});
