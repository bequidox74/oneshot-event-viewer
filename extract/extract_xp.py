import json
import logging
import os

from pathlib import Path
from argparse import Namespace
from utils import *


logger = logging.getLogger(__name__)

def do_xp(args: Namespace) -> None:
    in_path = Path(args.directory)
    out_path = Path(args.output)
    os.makedirs(out_path, exist_ok=True)

    # region load map infos
    with open(in_path / "MapInfos.json") as file:
        map_infos: dict = json.load(file)
        logger.info("loaded map infos")

    map_names: dict[int, str] = {}
    for map_ in map_infos:
        map_names[int(map_)] = map_infos[map_]["name"]

    save(map_names, out_path / "maps.json", args.pretty, args.dry_run)
    # endregion

    # region read misc names
    logger.info("loading item names")
    item_names: list[str] = []

    with open(in_path / "Items.json") as file:
        items: list[dict] = json.load(file)
    del items[0]
    for item in items:
        item_names.append(item["name"])

    logger.info("loading switches and vars")

    with open(in_path / "System.json") as file:
        system: dict = json.load(file)

    switches = system["switches"]
    del switches[0]

    variables = system["variables"]
    del variables[0]

    characters: list[str] = []
    logger.info("loading character names")
    with open(in_path / "Actors.json") as file:
        actors = json.load(file)

    del actors[0]
    for actor in actors:
        characters.append(actor["name"])

    out = {
        "items": item_names,
        "switches": switches,
        "vars": variables,
        "actors": characters,
    }
    save(out, out_path / "misc.json", args.pretty, args.dry_run)

    del items, system, actors
    # endregion

    # region process files
    logger.info("processing maps")
    for p in in_path.iterdir():
        if p.suffix != ".json":
            logger.debug(f"non-JSON file, skipping: {p}")
            continue

        if p.stem == "CommonEvents":
            logger.info("processing common events")
            with open(p) as file:
                root = json.load(file)

            events = process_common_events_xp(root)
            save(events, out_path / "common.json", args.pretty, args.dry_run)

        elif p.stem != "MapInfos" and p.stem.startswith("Map"):
            map_id = int(p.stem[-3:])
            map_name = map_infos[str(map_id)]["name"]
            logger.debug(f"processing map {map_name} ({p.name})")

            with open(p) as file:
                root = json.load(file)

            events = process_map_xp(root)
            map_ = {"name": map_name, "id": map_id, "events": events}
            save(map_, out_path / f"map{map_id}.json", args.pretty, args.dry_run)

        elif p.stem == "xScripts":
            with open(p) as file:
                scripts = json.load(file)

            scripts_path = out_path / "xScripts"
            os.makedirs(scripts_path, exist_ok=True)
            for script in scripts:
                name: str = script["name"]
                src: str = script["text"]
                src = src.replace("\r\n", "\n")

                if not args.dry_run:
                    with open(scripts_path / f"{name}.rb", "w") as file:
                        logger.debug(f"writing script {name}")
                        file.write(src)
    # endregion

    logger.info("done processing XP")


def process_common_events_xp(events: list) -> list[dict]:
    result = []
    for event in events:
        if event is None:  # skip the first null
            continue

        out = {}
        copy(event, out, "id", "name", "trigger")
        out["switchId"] = event["switch_id"]
        commands = parse_commands_xp(event["list"])
        out["commands"] = commands
        result.append(out)

    return result


def parse_commands_xp(commands: list[dict]) -> list[dict]:
    result = []
    i = 0
    while i < len(commands):
        cmd = commands[i]
        out = {}

        copy(cmd, out, "code")
        if cmd["indent"] != 0:
            out["indent"] = cmd["indent"]
        params = cmd["parameters"]

        # codes taken from GH: elizagamedev/mkxp-oneshot/scripts/Interpreter_X.rb
        match cmd["code"]:
            case 101:  # Show Text
                # player name, colors, portraits, etc. will be done in JS.
                text: str = getstr(params, 0)
                # merge following 401s
                while (next_ := at(commands, i + 1)) and next_["code"] == 401:
                    text += " " + getstr(next_["parameters"], 0)  # type: ignore
                    i += 1

                if not text:
                    out = None  # skip empty dialogue events
                else:
                    out["params"] = [text]
            case 355:  # Script
                script = getstr(params, 0) + "\n"
                # merge additional script lines
                while (next_ := at(commands, i + 1)) and next_["code"] == 655:
                    i += 1
                    script += getstr(next_["parameters"], 0) + "\n"  # type: ignore
                out["params"] = [script]
            case 0 | 108 | 408 | 412 | 404 | 509 | 655:
                out = None  # skip empties
            case _:
                pass

        if out is not None:
            if not out.get("params"):
                params = params_to_list(cmd["parameters"])
                if params:
                    out["params"] = params

            if cmd.get("audio_file") is not None:
                out["params"] = [cmd["audio_file"]]
            elif cmd.get("move_route") is not None:
                out["params"][1] = cmd["move_route"]

            result.append(out)

        i += 1
    return result


def process_map_xp(map_: dict) -> list[dict]:
    result = []
    events = map_["events"]
    if isinstance(events, dict):  # OS16
        events = events.values()

    for event in events:
        out = {}
        copy(event, out, "id", "name", "x", "y")

        page: dict
        pages = []
        for page in event["pages"]:
            page_out = {}

            pagecond: dict | None = page.get("condition", None)
            if pagecond is not None:
                condition = {}
                if pagecond["switch1_valid"]:
                    condition["switch1"] = pagecond["switch1_id"]
                if pagecond["switch2_valid"]:
                    condition["switch2"] = pagecond["switch2_id"]
                if pagecond["variable_valid"]:
                    condition["var"] = pagecond["variable_id"]
                    condition["value"] = pagecond["variable_value"]
                if pagecond["self_switch_valid"]:
                    condition["selfSwitch"] = pagecond["self_switch_ch"]
                if condition:
                    page_out["condition"] = condition

            commands = parse_commands_xp(page["list"])
            page_out["list"] = commands
            pages.append(page_out)

        out["pages"] = pages
        result.append(out)
    return result


def do_wme(args: Namespace) -> None:
    # first, check if we've been passed the path to the root or gamedata.
    in_dir = Path(args.directory)
    if (gd := in_dir / "gamedata").exists() and gd.is_dir():
        in_dir = gd
    out_dir = Path(args.output)
    os.makedirs(out_dir, exist_ok=True)

    # region load map names
    logger.info("loading map names")
    map_names: dict[int, str] = {}
    with open(in_dir / "oneshot_map_names.json") as file:
        obj: dict = json.load(file)
        for o in obj["map_names"]:
            id_ = int(o["id"])
            name = o["name"]
            map_names[id_] = name
            logger.debug(f"loaded map info for {name} ({id_})")
        del obj
    save(map_names, out_dir / "maps.json", args.pretty, args.dry_run)
    # endregion

    # region load common events
    logger.info("loading common events")
    with open(in_dir / "oneshot_common_events.json") as file:
        obj: dict = json.load(file)
    events = process_common_events_xp(obj["common_events"])
    save(events, out_dir / "common.json", args.pretty, args.dry_run)
    # endregion

    # region process maps
    logger.info("processing maps")
    for p in (in_dir / "maps").iterdir():
        if not p.stem.startswith("events_map"):
            continue

        map_id = int(p.stem[10:])  # skip "events_map"
        map_name = map_names[map_id]
        logger.debug(f"processing {map_name} ({map_id})")

        with open(p) as file:
            map_ = json.load(file)
        events = process_map_xp(map_)
        out = {"name": map_name, "id": map_id, "events": events}
        save(out, out_dir / f"map{map_id}.json", args.pretty, args.dry_run)
    # endregion

    logger.info("done processing WME")
