import { emitPage } from "./commands.ts";
import type { MapDefinition } from "./types.ts";

const root = document.getElementById("content")!;
const urlParams = new URLSearchParams(window.location.search);
const game = urlParams.get("game");
const map = urlParams.get("map");
const mapPath = `/dialogue/${game}/map${map}.json`;
const mapDef: MapDefinition = await fetch(mapPath).then(res => res.json());

(mapDef.events as [any]).sort((a, b) => a.id - b.id);
for (const event of mapDef.events) {
    const eventRoot = document.createElement("div");
    eventRoot.classList.add("event");
    eventRoot.id = "ev" + event.id;

    let heading = document.createElement("h2");
    let name = event.name ? event.name : "(unnamed)";
    name += ` (${event.id})`;
    heading.innerText = name;
    eventRoot.appendChild(heading);

    for (const [i, page] of event.pages.entries()) {
        eventRoot.appendChild(emitPage(page, i));
    }

    root.appendChild(eventRoot);
}
