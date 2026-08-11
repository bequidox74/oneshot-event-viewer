import { buildTree } from "./tree-builder";

type GameInfo = {
    name: string,
    wikilink: URL,
};
type MapNames = Record<number, string>;
type Map = {
    id: number,
    name: string,
}

// Fill game info

const urlParams = new URLSearchParams(window.location.search);
const gameId: string = urlParams.get("game")!;

const gameInfos: Record<string, GameInfo> = {
    "os14": {
        name: "OneShot 2014",
        wikilink: new URL("https://oneshot.wiki.gg/wiki/Oneshot_(2014)"),
    },
    "os16": {
        name: "OneShot 2016",
        wikilink: new URL("https://oneshot.wiki.gg/wiki/OneShot_(2016)"),
    },
    "wme": {
        name: "OneShot: World Machine Edition",
        wikilink: new URL("https://oneshot.wiki.gg/wiki/OneShot_(World_Machine_Edition)"),
    },
    "pc": {
        name: "The Pancake Episode",
        wikilink: new URL("https://oneshot.wiki.gg/wiki/The_Pancake_Episode"),
    },
}

const gameInfo = gameInfos[gameId];
document.getElementById("game-name")!.innerText = gameInfo.name + " Dump";
document.getElementById("wikilink")!.setAttribute("href", gameInfo.wikilink.href);


// Load map infos and parse maps

const mapNames: MapNames = await fetch(`/dialogue/${gameId}/maps.json`)
    .then(res => res.json());
const maps: Array<Map> = []

for (const mapInfo of Object.entries(mapNames)) {
    const id = parseInt(mapInfo[0]);
    const name = mapInfo[1];

    const map = { id: id, name: name };
    maps.push(map);
}
maps.sort((a, b) => a.id - b.id);


// Populate common events and maps

const eventList = document.getElementById("eventlist");

const commonEvents = document.createElement("li");
commonEvents.id = "cevents";
commonEvents.innerText = "Common Events"
eventList?.appendChild(commonEvents);

const promises = [];

promises.push(fetch(`/dialogue/${gameId}/common.json`)
    .then(res => res.json())
    .then(json => buildTree(json)));

for (const map of maps) {
    const mapEvents = document.createElement("li");
    mapEvents.id = `map${map.id}`;
    mapEvents.innerText = map.name + " (" + map.id + ")"
    eventList?.appendChild(mapEvents);

    promises.push(fetch(`/dialogue/${gameId}/map${map.id}.json`)
        .then(res => res.json())
        .then(json => {
            buildTree(json);
        }));
}

Promise.all(promises).then(() => {
    window.document.title = gameInfo.name + " Dialogue";
});
