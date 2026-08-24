import type { MapInfos } from "./types";

const details = document.querySelectorAll("details");
for (const d of details) {
  const key = `${d.id}-open`;
  d.addEventListener("toggle", () => {
    sessionStorage.setItem(key, d.open.toString());
  });
  const value = sessionStorage.getItem(key);
  if (value) d.open = value == "true";
}

const games = ["os14", "os16", "wme", "pc", "frostide"];
for (const game of games) {
  const maps: MapInfos = await fetch(`data/${game}/maps.json`).then((res) =>
    res.json(),
  );

  const mapList = document.getElementById(game)!;

  const innerLists: Map<number, HTMLUListElement> = new Map();
  const elems: Map<number, HTMLLIElement> = new Map();

  function makeLink(
    href: string,
    text: string,
    mapId: number | null,
    cls?: string,
  ): HTMLLIElement {
    const li = document.createElement("li");
    const ul = document.createElement("ul");
    const a = document.createElement("a");

    a.href = href;
    a.textContent = text;
    if (cls) a.classList.add(cls);

    li.appendChild(a);
    li.appendChild(ul);

    if (mapId) innerLists.set(mapId, ul);
    return li;
  }

  const allMapsLink = makeLink(
    `dump?game=${game}&map=all`,
    "All Maps",
    null,
    "highlight",
  );
  allMapsLink.title = "Warning! This may lag your browser!";
  mapList.appendChild(allMapsLink);
  mapList.appendChild(
    makeLink(
      `dump?game=${game}&map=common`,
      "Common Events",
      null,
      "highlight",
    ),
  );

  // make all links
  for (const entry of Object.entries(maps)) {
    const id = parseInt(entry[0]);
    const mapInfo = entry[1];
    elems.set(
      id,
      makeLink(
        `dump?game=${game}&map=${id}`,
        `[${id}] ${mapInfo.name ?? "(unnamed map)"}`,
        id,
      ),
    );
  }

  for (const [id, elem] of elems.entries()) {
    const parentId = maps[id].parent;
    const parent = innerLists.get(parentId) ?? mapList;
    parent.appendChild(elem);
  }

  // prune empty lists
  for (const list of innerLists.values()) {
    if (!list.hasChildNodes()) list.remove();
  }
}
