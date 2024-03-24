export type ActionType = string | number | symbol;

export type ActionDefinition<Action extends ActionType, Payload = unknown> = {
  type: Action;
  payload: Payload;
};

export type ActionsDefinitions<Actions extends ActionType = string> = {
  [Action in Actions]: ActionDefinition<Action>;
};

export type ActionOf<
  Definitions extends ActionsDefinitions<keyof Definitions>,
  ActionType extends keyof Definitions,
> = Definitions[ActionType];

export type PayloadOf<
  Definitions extends ActionsDefinitions<keyof Definitions>,
  ActionType extends keyof Definitions,
> = ActionOf<Definitions, ActionType>["payload"];

export type ActionParameters<
  Definitions extends ActionsDefinitions<keyof Definitions>,
  ActionType extends keyof Definitions,
> =
  PayloadOf<Definitions, ActionType> extends undefined
    ? [ActionType]
    : [ActionType, PayloadOf<Definitions, ActionType>];
