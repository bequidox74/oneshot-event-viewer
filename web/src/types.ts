export type MapDefinition = {
    name: string,
    id: number,
    events: [MapEvent],
}

export type CommonEvents = [CommonEvent];

export type Event = {
    id: number,
    name: string | undefined,
}

export type MapEvent = Event & {
    x: number,
    y: number,
    pages: EventPage[],
}

export type CommonEvent = Event & {
    trigger: number,
    switchId: number,
    commands: EventCommand[],
}

export type EventPage = {
    condition: PageCondition,
    list: EventCommand[],
}

export type PageCondition = {
    switch1: number | undefined,
    switch2: number | undefined,
    var: string | undefined,
    value: string | undefined,
    selfSwitch: string | undefined,
};

export type EventCommand = {
    code: number,
    indent: number | undefined,
    params: any[],
}
