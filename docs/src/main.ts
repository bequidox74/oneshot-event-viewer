const games = ["os14", "os16", "wme", "pc"];
for (const game of games) {
  const maps: Record<string, string> = await fetch(
    `data/${game}/maps.json`,
  ).then((res) => res.json());

  const ul = document.getElementById(game)!;
  function makeLink(href: string, text: string, cls?: string): HTMLLIElement {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    if (cls) a.classList.add(cls);
    li.appendChild(a);
    return li;
  }

  ul.appendChild(makeLink(`dump?game=${game}&map=all`, "All Maps", "highlight"));
  ul.appendChild(makeLink(`dump?game=${game}&map=common`, "Common Events", "highlight"));
  for (const [id, name] of Object.entries(maps)) {
    ul.appendChild(
      makeLink(
        `dump?game=${game}&map=${id}`,
        `[${id}] ${name ?? "(unnamed map)"}`,
      ),
    );
  }
}
