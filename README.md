# Simple Store
A simple state manager that can store data via a reducer function.

### Install
`yarn add @mcastiello/simple-store`

`npm install @mcastiello/simple-store`

## Create a store
In order to create a store, you will need to provide a reducer function to allow the users to modify the state.

While it is not essential, it is recommended to provide type definitions for your state and all the actions supported. This will allow the store manager to provide a safer environment and a better developer experience (your IDE will be able to suggest you the type of the payload of your actions, based on the action type you are using).


The following is a simple example of how to define your store.
```ts
import { ActionDefinition, Reducer, StoreInterceptor,  createStore } from "@mcastiello/simple-store";

// Define the list of actions supported by your store
enum Action {
  Initialise,
  Update,
  Destroy,
}

// Define the payload of each action
type Definitions = {
  [Action.Initialise]: ActionDefinition<Action.Initialise, boolean>;
  [Action.Update]: ActionDefinition<Action.Update, string>;
  [Action.Destroy]: ActionDefinition<Action.Destroy, undefined>;
};

// Define the type of your state
type State = {
  init?: boolean;
  value?: string;
};

// Create the reducer function
const reducer: Reducer<State, Definitions> = (state = {}, action) => {
  switch (action.type) {
    case Action.Initialise:
      return { ...state, init: action.payload };
    case Action.Update:
      return { ...state, value: action.payload };
    case Action.Destroy:
      return {};
    }
};

// Initialise your store
const store = createStore(reducer);
```

## `dispatch`
The dispatch method allows you to send action that will eventually update the state

```ts
store.dispatch(Action.Initialise, true);
```
If you defined the types correctly, TypeScript will throw a type error if you try to dispatch the wrong payload for the chosen action.

## `subscribe`
The subscribe method allows you to register a function that will be executed asynchronously whenever the state gets updated.

```ts
store.subscribe((state) => console.log("The state has been updated", state));
```

It is possible to lock your subscription to a set of specific actions. If you do so, your subscription will only be executed when one of the provided actions is dispatched.

```ts
store.subscribe((state) => console.log(`The updated value is ${state.value}`), [Action.Update]);
```

Your subscription will also receive the action that caused the state to update.

```ts
store.subscribe((state, action) => action && console.log(`The state has been updated by the action ${action.type}`));
```

The `action` parameter could be undefined, this is because, when registered, each subscription is immediately executed with the current value of the state.

## `intercept`
The intercept method allow you to intercept an action and modify the new state created by the reducer. Interceptors need to be associated with one or more actions, and they will always need to return a version of the state.

The following is a simple example of a use case for using an interceptor. The user is storing a value, and the interceptor is determining if the value has gone up or down.
```ts
import { ActionDefinition, Reducer, StoreInterceptor,  createStore } from "@mcastiello/simple-store";

// Define the list of actions supported by your store
enum Action {
  SetValue,
}

enum Direction {
  Up,
  Down,
  Stable
}

// Define the payload of each action
type Definitions = {
  [Action.SetValue]: ActionDefinition<Action.Initialise, boolean>;
};

// Define the type of your state
type State = {
  value: number;
  direction: Direction;
};

const initialState: State = {
  value: 0,
  direction: Direction.Stable,
};

// Create the reducer function
const reducer: Reducer<State, Definitions> = (state, action) => {
  switch (action.type) {
    case Action.SetValue:
      return { ...state, value: action.payload };
  }
};

// Initialise your store
const store = createStore(reducer, initialState);

// Intercept the state and compare it with the previous version to update the direction property accordingly
store.intercept((oldState, newState) => {
  if (newState.value > oldState.value && newState.direction !== Direction.Up) {
    return { ...newState, direction: Direction.Up };
  } else if (newState.value < oldState.value && newState.direction !== Direction.Down) {
    return { ...newState, direction: Direction.Down };
  } else if (newState.value === oldState.value && newState.direction !== Direction.Stable) {
    return { ...newState, direction: Direction.Stable };
  }
  return newState;
}, [Action.SetValue])
```
Basically, you can use the interceptors to extend the functionality of the reducer, as they are executed after the reducer synchronously, and their result is eventually sent tot the subscriptions.

Your function will receive the action that updated the state as a third parameter. If your interceptor is meant to handle more than one action, you can use that to identify how to update the state.

```ts
store.intercept((oldState, newState, action) => {
  switch (action.type) {
    // Your action based logic
  }
}, [Action.Initialise, Action.SetValue]);
```

## `state`
The store object will come with a `state` property that will allow you to access the current values stored in the state. The property is just a proxy that will only let you read the content, not modify it.

```ts
console.log(store.state.value);
```

> The library is not freezing the content of the state (mostly for performance reasons), so while you won't be able to update primitive values of the state, you will still be able to insert values in arrays, or update the content of child objects. Doing so would of course defy the purpose of a reducer, so, do it at your own risk (and TypeScript may still throw a type error in some scenarios). 
