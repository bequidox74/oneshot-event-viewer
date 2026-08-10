import json
import argparse
import logging
import xml.etree.ElementTree as ET

from argparse import Namespace
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def copy(src: dict, dst: dict, *keys: str):
    for key in keys:
        dst[key] = src[key]


def at(list_: list, i: int) -> Any | None:
    if i < len(list_):
        return list_[i]
    return None


def getint(params: list[dict], i: int) -> int:
    return params[i]["Integer"]


def getstr(params: list[dict], i: int) -> str:
    if isinstance(params[i], str):
        return params[i]  # type: ignore
    return params[i]["String"]


def getparam(params: list[dict], i: int) -> int | str | list | dict:
    param = params[i]
    if isinstance(param, str):  # WME
        try:
            return int(param)
        except ValueError:
            return param

    if (value := param.get("Integer")) is not None:
        return value
    elif (value := param.get("String")) is not None:
        return value
    elif (value := param.get("Array")) is not None:
        return params_to_list(value)
    else:
        return param


def save(obj, file, pretty: bool) -> None:
    indent = 2 if pretty else None
    separators = (",", ": ") if pretty else (",", ":")
    file.write(json.dumps(obj, indent=indent, separators=separators))


def params_to_list(params: list[dict]) -> list:
    result = []
    for i in range(len(params)):
        result.append(getparam(params, i))
    return result


def gett(elem: ET.Element, tag: str) -> ET.Element:
    result = elem.find(tag)
    assert result is not None
    return result


def getv(elem: ET.Element, tag: str) -> str:
    e_tag = gett(elem, tag)
    text = e_tag.text
    return text if text is not None else ""


def geta(elem: ET.Element, attribute: str) -> str:
    att = elem.get(attribute)
    assert att is not None
    return att


def getflag(elem: ET.Element, tag: str) -> bool:
    return False if getv(elem, tag) == "F" else True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("directory")
    parser.add_argument("-g", "--game", choices=["os14", "os16", "wme"], required=True)
    parser.add_argument(
        "-l",
        "--log-level",
        choices=["debug", "info", "warning", "error", "critical"],
        default="info",
    )
    parser.add_argument("-o", "--output", default="./out")
    parser.add_argument("-p", "--pretty", action="store_true")
    parser.add_argument("-d", "--dry-run", action="store_true")

    args = parser.parse_args()
    logging.basicConfig(level=args.log_level.upper())

    match args.game:
        case "os14":
            do_os14(args)
        case "os16":
            do_os16(args)
        case "wme":
            do_wme(args)


def do_os14(args: Namespace) -> None:
    in_path = Path(args.directory)
    out_path = Path(args.output)
    os.makedirs(out_path, exist_ok=True)

    # region read map names
    logger.info("loading map names")
    map_names: dict[int, str] = {}
    emt = ET.parse(in_path / "RPG_RT.emt")
    for map_info in emt.getroot()[0][0]:
        map_names[int(geta(map_info, "id"))] = getv(map_info, "name")
    del emt
    # endregion

    # region process common events
    logger.info("processing common events")
    edb = ET.parse(in_path / "RPG_RT.edb")
    db = edb.getroot()[0]
    out = []
    for event in gett(db, "commonevents"):
        out_event = {}
        out_event["id"] = int(geta(event, "id"))
        out_event["name"] = getv(event, "name")
        out_event["trigger"] = getv(event, "trigger")
        out_event["switchFlag"] = getflag(event, "switch_flag")
        out_event["switchId"] = int(getv(event, "switch_id"))

        commands = parse_commands_old(gett(event, "event_commands"))
        if commands:
            out_event["list"] = commands
        out.append(out_event)

    if not args.dry_run:
        with open(out_path / "common.json", "w") as file:
            save(out, file, args.pretty)
    del edb
    # endregion

    # region process maps
    logger.info("processing maps")
    for p in in_path.iterdir():
        if not p.stem.startswith("Map"):
            continue

        map_id = int(p.stem[3:])
        map_name = map_names[map_id]
        logger.debug(f"processing map {map_name} (map_id)")
        root = ET.parse(p).getroot()[0]

        out_events = []
        for event in gett(root, "events"):
            out_event = {}
            out_event["id"] = int(geta(event, "id"))
            out_event["x"] = int(getv(event, "x"))
            out_event["y"] = int(getv(event, "y"))

            out_pages = []
            for page in gett(event, "pages"):
                out_page = parse_page_2k3(page)
                out_pages.append(out_page)
            out_event["pages"] = out_pages
            out_events.append(out_event)
        out = {"name": map_name, "events": out_events}

        if not args.dry_run:
            with open(out_path / f"map{map_id}.json", "w") as file:
                logger.debug(f"writing map {map_name} ({map_id})")
                save(out, file, args.pretty)
    # endregion


def parse_page_2k3(page: ET.Element) -> dict:
    out_page = {}

    conditions = {}
    epc = gett(page, "condition")[0]
    flags = gett(epc, "flags")[0]

    def add_condition(flag: str, value: str, key: str | None = None):
        if key is None:
            key = flag
        if getflag(flags, flag):
            conditions[key] = int(getv(epc, value))

    add_condition("switch_a", "switch_a_id", "switch1")
    add_condition("switch_b", "switch_b_id", "switch2")
    add_condition("variable", "variable_value", "var")
    add_condition("item", "item_id")
    add_condition("actor", "actor_id")
    add_condition("timer", "timer_sec")
    add_condition("timer2", "timer2_sec")
    if conditions:
        out_page["condition"] = conditions

    commands = parse_commands_old(gett(page, "event_commands"))
    if commands:
        out_page["list"] = commands
    return out_page


def parse_commands_old(commands: ET.Element) -> list[dict]:
    out = []
    for ec in commands:
        cmd = parse_command_old(ec)
        if cmd:
            out.append(cmd)
    return out


def parse_command_old(command: ET.Element) -> dict:
    out_cmd = {}
    out_cmd["code"] = int(getv(command, "code"))

    indent = int(getv(command, "indent"))
    if indent != 0:
        out_cmd["indent"] = indent

    params = [int(x) for x in getv(command, "parameters").split()]
    if params:
        out_cmd["params"] = params

    return out_cmd


def do_os16(args: Namespace) -> None:
    in_path = Path(args.directory)
    out_path = Path(args.output)
    os.makedirs(out_path, exist_ok=True)

    # load map infos
    with open(in_path / "MapInfos.json") as file:
        map_infos: dict = json.load(file)
        logger.info("loaded map infos")

    # process files
    for p in in_path.iterdir():
        if p.suffix != ".json":
            logger.debug(f"non-JSON file, skipping: {p}")
            continue

        if p.stem == "CommonEvents":
            logger.debug("processing common events")
            with open(p) as file:
                root = json.load(file)

            events = process_common_events_new(root)

            if not args.dry_run:
                with open(out_path / "common.json", "w") as file:
                    save(events, file, args.pretty)

        elif p.stem != "MapInfos" and p.stem.startswith("Map"):
            map_num = int(p.stem[-3:])
            map_name = map_infos[str(map_num)]["name"]
            logger.debug(f"processing map {map_name} ({p.name})")

            with open(p) as file:
                root = json.load(file)

            events = process_map_new(root)
            map_ = {"name": map_name, "events": events}

            if not args.dry_run:
                with open(out_path / f"map{map_num}.json", "w") as file:
                    save(map_, file, args.pretty)

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

    logger.info("done processing OS16")


def process_common_events_new(events: list) -> list[dict]:
    result = []
    for event in events:
        if event is None:  # skip the first null
            continue

        out = {}
        copy(event, out, "id", "name", "trigger", "switch_id")
        commands = parse_commands_new(event["list"])
        out["commands"] = commands
        result.append(out)

    return result


def parse_commands_new(commands: list[dict]) -> list[dict]:
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
                out["params"] = [text]
            case 355:
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
            result.append(out)

        i += 1
    return result


def process_map_new(map_: dict) -> list[dict]:
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

            commands = parse_commands_new(page["list"])
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
            id_ = o["id"]
            name = o["name"]
            map_names[id_] = name
            logger.debug(f"loaded map info for {name} ({id_})")
        del obj
    # endregion

    # region load common events
    logger.info("loading common events")
    with open(in_dir / "oneshot_common_events.json") as file:
        obj: dict = json.load(file)
    events = process_common_events_new(obj["common_events"])
    if not args.dry_run:
        with open(out_dir / "common.json", "w") as file:
            save(events, file, args.pretty)
            logger.debug("saved common events")
    # endregion

    # region process maps
    logger.info("processing maps")
    for p in (in_dir / "maps").iterdir():
        if not p.stem.startswith("events_map"):
            continue

        map_num = int(p.stem[10:])  # skip "events_map"
        map_name = map_names[map_num]
        logger.debug(f"processing {map_name} ({map_num})")

        with open(p) as file:
            map_ = json.load(file)
        events = process_map_new(map_)
        if not args.dry_run:
            with open(out_dir / f"map{map_num}.json", "w") as file:
                logger.debug(f"saving map {map_name}")
                out = {"name": map_name, "events": events}
                save(out, file, args.pretty)
    # endregion

    logger.info("done processing WME")


if __name__ == "__main__":
    main()
