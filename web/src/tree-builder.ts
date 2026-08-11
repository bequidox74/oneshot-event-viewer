type MapDefinition = {
    name: string,
    id: number,
    events: [MapEvent],
}

type CommonEvents = [CommonEvent];

type Event = {
    id: number,
    name: string,
}

type MapEvent = Event & {
    x: number,
    y: number,
    pages: [EventPage],
}

type CommonEvent = Event & {
    trigger: number,
    switchId: number,
    commands: [EventCommand],
}

type EventPage = {
    condition: PageCondition,
    list: [EventCommand],
}

type PageCondition = {
    switch1: number | undefined,
    switch2: number | undefined,
    var: string | undefined,
    value: string | undefined,
    selfSwitch: string | undefined,
};

type EventCommand = {
    code: number,
    indent: number | undefined,
    params: [string | number | any],
}

export function buildTree(definition: any): void {
    const innerList = document.createElement("ul");
    if (definition.events !== undefined) {
        const mapDef = definition as MapDefinition;
        const item = document.getElementById(`map${mapDef.id}`)!;
        item.innerText = mapDef.name;
        for (const event of mapDef.events) {
            innerList.appendChild(emitMapEvent(event));
        }
        item.appendChild(innerList);
    } else if (Array.isArray(definition)) {
        const events = definition as CommonEvents;
        const item = document.getElementById("cevents")!;
        item.innerText = "Common Events"
        events.sort((a, b) => a.id - b.id)
        for (const event of events) {
            innerList.appendChild(emitCommonEvent(event))
        }
        item.appendChild(innerList);
    } else {
        throw new Error("Unknown type of definition");
    }
}

function emitMapEvent(event: MapEvent): HTMLElement {
    const out = document.createElement("li");
    out.classList.add("event");
    out.innerHTML = getNameHtml(event.name, event.id);
    return out;
}

function emitCommonEvent(event: CommonEvent): HTMLElement {
    const out = document.createElement("li");
    out.classList.add("event");
    out.innerHTML = getNameHtml(event.name, event.id);
    return out;
}

function getNameHtml(name: string, id: number): string {
    if (!name) return `<span class="subtle"><i>(unnamed) (${id})</i></span>`
    else return `${name} (${id})`;
}
