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
const isDialogue: boolean = urlParams.get("mode") === "dialogue";

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


// Build navigation

const navigation = document.getElementById("navigation");

function addNavItem(text: string, anchor: string) {
    const item = document.createElement("li");
    const a = document.createElement("a");
    a.innerText = text;
    a.setAttribute("href", window.location.href + "#" + anchor);
    item.appendChild(a);
    navigation?.appendChild(item);
}

addNavItem("Common Events", "cevents");
for (const map of maps) {
    const name = map.name ? map.name : map.id.toString().padStart(4, "0");
    addNavItem(name, `map${map.id}`);
}


// Build content
