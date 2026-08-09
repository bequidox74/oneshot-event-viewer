import json
import argparse
import logging

from argparse import Namespace
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

OPERATORS = {
    0: "==",
    1: ">=",
    2: "<=",
    3: ">",
    4: "<",
    5: "!=",
}

CONTROL_TYPES = {
    0: "=",
    1: "+=",
    2: "-=",
    3: "*=",
    4: "/=",
    5: "%=",
}

CONTROL_ACTOR = {
    0: "level",
    1: "exp",
    2: "hp",
    3: "sp",
    4: "maxhp",
    5: "maxsp",
    6: "str",
    7: "dex",
    8: "agi",
    9: "int",
    10: "atk",
    11: "pdef",
    12: "mdef",
    13: "eva",
}

CONTROL_CHARACTER = {
    0: "x",
    1: "y",
    2: "direction",
    3: "screen_x",
    4: "screen_y",
    5: "terrain_tag",
}

CONTROL_OTHER = {
    0: "map_id",
    1: "party_size",
    2: "gold",
    3: "steps",
    4: "play_time",
    5: "timer",
    6: "save_count",
}


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
    return params[i]["String"]


def getarr(params: list[dict], i: int) -> list:
    return params[i]["Array"]


def getparam(params: list[dict], i: int) -> int | str | list | dict:
    param = params[i]
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
    raise NotImplementedError


def do_os16(args: Namespace) -> None:
    in_path = Path(args.directory)
    out_path = Path(args.output)
    os.makedirs(out_path, exist_ok=True)

    # load map infos
    with open(in_path / "MapInfos.json") as file:
        map_infos: dict = json.load(file)
        logger.info("loaded map infos")

    # load switches and variables
    with open(in_path / "System.json") as file:
        system: dict = json.load(file)
        logger.info("loaded system")

    global os16_switches, os16_gamevars
    os16_switches = system["switches"]
    os16_gamevars = system["variables"]
    del system

    # load actors
    with open(in_path / "Actors.json") as file:
        actors: dict = json.load(file)
        logger.info("loaded actors")

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
                with open(out_path / f"map{map_num:03}.json", "w") as file:
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

    logger.info("done processing OS16.")


def process_common_events_new(events: list) -> list[dict]:
    result = []
    for event in events:
        if event is None:  # skip the first null
            continue

        out = {}
        copy(event, out, "id", "name")

        if event["trigger"]:
            out["trg"] = event["trigger"]
        if event["switch_id"]:
            out["sw"] = event["switch_id"]

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

            case 111:  # Conditional Branch
                break
                type_ = getint(params, 0)
                match type_:
                    case 0:
                        data["type"] = "switch"
                        data["index"] = getint(params, 1)
                        data["name"] = os16_switches[data["index"]]
                        data["on"] = getint(params, 2) == 0

                    case 1:
                        data["type"] = "variable"
                        data["value1"] = os16_gamevars[getint(params, 1)]
                        data["oper"] = OPERATORS[getint(params, 4)]
                        data["value2"] = (
                            getint(params, 3)
                            if getint(params, 2) == 0
                            else os16_gamevars[getint(params, 3)]
                        )

                    case 2:
                        data["type"] = "selfSwitch"
                        data["name"] = getstr(params, 1)
                        data["on"] = getint(params, 2) == 0

                    case 4:
                        data["type"] = "actor"
                        data["actor"] = os16_actors[getint(params, 1)]
                        logger.debug(f"actor ref: {data["actor"]}")

                        match getint(params, 2):
                            case 0:
                                data["check"] = "inParty"
                            case _:
                                raise ValueError(
                                    f"unsupported actor check type: {type_}"
                                )

                    case 6:
                        data["type"] = "character"
                        data["char"] = getint(params, 1)
                        data["dir"] = getint(params, 2)

                    case 8:
                        data["type"] = "item"
                        data["id"] = getint(params, 1)

                    case 11:
                        data["type"] = "button"
                        data["btn"] = getint(params, 1)

                    case 12:
                        data["type"] = "script"

                    case _:  # unused in OS16
                        raise ValueError(f"unsupported condition type: {type_}")

            case 122:  # Control Variables
                break
                data["from"] = getint(params, 0)
                data["to"] = getint(params, 1)
                data["type"] = CONTROL_TYPES[getint(params, 2)]
                match getint(params, 3):
                    case 0:  # invariable
                        data["value"] = getparam(params, 4)
                    case 1:  # variable
                        data["value"] = f"$var{getint(params, 4)}"
                    case 2:  # random number
                        from_ = getint(params, 4)
                        to = getint(params, 5)
                        data["value"] = f"$rand({from_}..={to})"
                    case 3:  # item
                        data["value"] = f"$item({getint(params, 4)})"
                    case 4:  # actor
                        actor = getint(params, 4)
                        type_ = CONTROL_ACTOR[getint(params, 5)]
                        data["value"] = f"$actor{actor}.{type_}"
                    case 5:  # enemy
                        enemy = getint(params, 4)
                        type_ = CONTROL_ACTOR[getint(params, 5) + 2]
                        data["value"] = f"$enemy{enemy}.{type_}"
                    case 6:  # character
                        char = getint(params, 4)
                        type_ = CONTROL_CHARACTER[getint(params, 5)]
                        data["value"] = f"$character{char}.{type_}"
                    case 7:  # other
                        type_ = CONTROL_OTHER[getint(params, 4)]
                        data["value"] = f"${type_}"

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
    for event in map_["events"].values():
        out = {}
        copy(event, out, "id", "name", "x", "y")

        page: dict
        pages = []
        for page in event["pages"]:
            page_out = {}

            pc: dict | None = page.get("condition", None)
            if pc is not None:
                condition = {}
                if pc["switch1_valid"]:
                    condition["switch1"] = pc["switch1_id"]
                if pc["switch2_valid"]:
                    condition["switch2"] = pc["switch2_id"]
                if pc["variable_valid"]:
                    condition["var"] = pc["variable_id"]
                    condition["value"] = pc["variable_value"]
                if pc["self_switch_valid"]:
                    condition["selfSwitch"] = pc["self_switch_ch"]
                if condition:
                    page_out["condition"] = condition

            commands = parse_commands_new(page["list"])
            page_out["list"] = commands
            pages.append(page_out)

        out["pages"] = pages
        result.append(out)
    return result


def do_wme(args: Namespace) -> None:
    raise NotImplementedError


if __name__ == "__main__":
    main()
