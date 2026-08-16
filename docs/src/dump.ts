import { makeCommonEvents, makeMap } from "./tree";
import type { CommonEvents, MapDefinition } from "./types";

const expandAll = document.getElementById("expand")!;
expandAll.onclick = () => {
  document.querySelectorAll("details").forEach((it) => (it.open = true));
};

const collapseAll = document.getElementById("collapse")!;
collapseAll.onclick = () => {
  document.querySelectorAll("details").forEach((it) => (it.open = false));
};

document.title = "Loading...";

const urlParams = new URLSearchParams(window.location.search);
const game = urlParams.get("game")!;
const map = urlParams.get("map") ?? "common";
const skip = urlParams.has("skip");

const root = document.getElementById("root")!;

if (map === "common") {
  const events: CommonEvents = await fetch(`data/${game}/common.json`).then(
    (res) => res.json(),
  );
  const tree = makeCommonEvents(events, skip);
  root.appendChild(tree);
} else {
  const files: string[] = [];
  if (map === "all") {
    const maps: Record<string, string> = await fetch(
      `data/${game}/maps.json`,
    ).then((res) => res.json());
    for (const id of Object.keys(maps))
      files.push(`data/${game}/map${id}.json`);
  } else {
    files.push(`data/${game}/map${map}.json`);
  }

  const promises: Promise<MapDefinition>[] = [];
  for (const file of files) {
    promises.push(fetch(file).then((res) => res.json()));
  }

  const loadedMaps = await Promise.all(promises);
  for (const map of loadedMaps) {
    const tree = makeMap(map, skip);
    root.appendChild(tree);
  }
}

document.getElementById("status")!.hidden = true;
document.title = "OneShot Event Viewer";
