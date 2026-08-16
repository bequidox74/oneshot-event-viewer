export type MapDefinition = {
  name: string;
  id: number;
  events: [MapEvent];
};

export type CommonEvents = CommonEvent[];

export type RpgEvent = {
  id: number;
  name: string | undefined;
};

export type MapEvent = RpgEvent & {
  x: number;
  y: number;
  pages: EventPage[];
};

export type CommonEvent = RpgEvent & {
  trigger: number;
  switchId: number;
  commands: EventCommand[];
};

export type EventPage = {
  condition: PageCondition;
  list: EventCommand[];
};

export type PageCondition = {
  switch1: number | undefined;
  switch2: number | undefined;
  var: string | undefined;
  value: string | undefined;
  selfSwitch: string | undefined;
};

export type EventCommand = {
  code: number;
  indent: number | undefined;
  params: unknown[];
};

export type AudioFile = {
  name: string;
  volume: number;
  pitch: number;
};
