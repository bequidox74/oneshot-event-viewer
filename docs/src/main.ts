import { makeCommonEvents, makeMap } from "./tree";
import type { CommonEvents, MapDefinition } from "./types";

const content = document.getElementById("content")!;

const urlParams = new URLSearchParams(window.location.search);
const game = urlParams.get("game");

const filterString = urlParams.get("filter") ?? "";
const filters: string[] = filterString ? filterString.split(",") : [];
const noCommon: boolean = urlParams.has("nocommon");

// load maps & common events
const mapList: Record<string, string> = await fetch(`dialogue/${game}/maps.json`)
    .then(res => res.json());

const maps: MapDefinition[] = [];
for (const mapId of Object.keys(mapList)) {
    const filename = `map${mapId}`;
    if (filters.length > 0 && !filters.includes(filename)) continue;
    const map: MapDefinition = await fetch(`dialogue/${game}/${filename}.json`)
        .then(res => res.json());
    maps.push(map);
}
maps.sort((a, b) => a.id - b.id);

// emit content
if (!noCommon) {
    const commonEvents: CommonEvents = await fetch(`dialogue/${game}/common.json`)
        .then(res => res.json());
    content.appendChild(makeCommonEvents(commonEvents));
}
for (const map of maps) {
    content.appendChild(makeMap(map));
}
