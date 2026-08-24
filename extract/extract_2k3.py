import logging
import os

from xml.etree import ElementTree as ET
from argparse import Namespace
from pathlib import Path
from utils import *

logger = logging.getLogger(__name__)


def do_2k3(args: Namespace) -> None:
    in_path = Path(args.input)
    out_path = Path(args.output)
    os.makedirs(out_path, exist_ok=True)

    edb = ET.parse(in_path / "RPG_RT.edb").getroot()[0]

    map_names = get_map_names(in_path)
    save(map_names, out_path / "maps.json", args.pretty, args.dry_run)

    misc = get_misc(edb)
    save(misc, out_path / "misc.json", args.pretty, args.dry_run)

    common_events = get_common_events(edb)
    save(common_events, out_path / "common.json", args.pretty, args.dry_run)

    logger.info("processing maps")
    for path in in_path.iterdir():
        if path.suffix != ".emu":
            continue  # all maps are .emu

        map_ = get_map(path)
        id_: int = map_["id"]
        map_["name"] = map_names[id_]["name"]
        map_["parent"] = map_names[id_]["parent"]
        save(map_, out_path / f"map{id_}.json", args.pretty, args.dry_run)


def get_map_names(in_path: Path) -> dict[int, dict]:
    logger.info("processing map names")
    map_names = {}
    emt = ET.parse(in_path / "RPG_RT.emt").getroot()[0][0]
    for map_info in emt:
        map_names[int(getatt(map_info, "id"))] = {
            "name": getvalue(map_info, "name"),
            "parent": getvalue(map_info, "parent_map"),
        }
    del map_names[0]  # exclude ID 0 because it's not really a map
    return map_names


def get_common_events(edb: ET.Element) -> list[dict]:
    logger.info("processing common events")
    out = []
    for ein in gettag(edb, "commonevents"):
        eout = {}
        eout["id"] = int(getatt(ein, "id"))
        eout["name"] = getvalue(ein, "name")

        eout["trigger"] = int(getvalue(ein, "trigger"))
        if getflag(ein, "switch_flag"):
            eout["switchId"] = int(getvalue(ein, "switch_id"))

        commands = parse_commands_old(gettag(ein, "event_commands"))
        if commands:
            eout["commands"] = commands
        out.append(eout)
    return out


def get_misc(edb: ET.Element) -> dict[str, list[str]]:
    def load_group(group: str) -> list[str]:
        logger.debug(f"processing {group}")
        out: list[str] = []
        for t in gettag(edb, group):
            out.append(getvalue(t, "name"))
        return out

    switches = load_group("switches")
    variables = load_group("variables")
    items = load_group("items")
    actors = load_group("actors")
    skills = load_group("skills")

    return {
        "switches": switches,
        "vars": variables,
        "items": items,
        "actors": actors,
        "skills": skills,
    }


def get_map(in_path: Path) -> dict:
    map_id = int(in_path.stem[3:])
    logger.debug(f"processing map {map_id}")

    root = ET.parse(in_path).getroot()[0]

    map_events = []
    for ein in gettag(root, "events"):
        eout = {}
        eout["id"] = int(getatt(ein, "id"))
        eout["x"] = int(getvalue(ein, "x"))
        eout["y"] = int(getvalue(ein, "y"))

        pout = []
        for pin in gettag(ein, "pages"):
            out_page = parse_page_2k3(pin)
            pout.append(out_page)
        eout["pages"] = pout
        map_events.append(eout)
    out = {
        "name": None,
        "id": map_id,
        "parent": None,
        "events": map_events,
    }  # None to preserve order of keys in a dict
    return out


def parse_page_2k3(pin: ET.Element) -> dict:
    pout = {}
    cout = {}
    cin = gettag(pin, "condition")[0]
    flags = gettag(cin, "flags")[0]

    def add_condition(flag: str, value: str, key: str | None = None):
        if key is None:
            key = flag
        if getflag(flags, flag):
            cout[key] = int(getvalue(cin, value))

    add_condition("switch_a", "switch_a_id", "switch1")
    add_condition("switch_b", "switch_b_id", "switch2")

    if getflag(flags, "variable"):
        cout["var"] = int(getvalue(cin, "variable_id"))
        cout["value"] = int(getvalue(cin, "variable_value"))
        cout["oper"] = int(
            getvalue(cin, "compare_operator")
        )  # see https://github.com/EasyRPG/Player/blob/212f3466c9f276ff7cade5a5ead78d3a151343ac/src/game_interpreter_shared.h#L184

    # these are only used in 2k3
    add_condition("item", "item_id")
    add_condition("actor", "actor_id")
    add_condition("timer", "timer_sec")
    add_condition("timer2", "timer2_sec")

    if cout:
        pout["condition"] = cout
    commands = parse_commands_old(gettag(pin, "event_commands"))
    if commands:
        pout["list"] = commands
    return pout


def parse_commands_old(commands: ET.Element) -> list[dict]:
    out: list[dict] = []
    for cmd in commands:
        cout = {}
        code = int(getvalue(cmd, "code"))
        params: list = [int(x) for x in getvalue(cmd, "parameters").split()]
        string = getvalue(cmd, "string")

        cout["code"] = code
        cout["params"] = params
        if string:
            cout["params"].append(string)
        indent = int(getvalue(cmd, "indent"))
        if indent != 0:
            cout["indent"] = indent

        match code:
            case 10110:  # ShowMessage -> 101 Show Text
                cout["params"] = [string]
            case 20110:  # ShowMessage_2 -> 401 More Text
                cout = None
                out[-1]["params"][0] += " " + string
            case 10 | 12410 | 20141 | 22011 | 22210:  # suppress empties
                cout = None
            case _:
                pass

        if cout is not None:
            out.append(cout)

    return out


def gettag(elem: ET.Element, tag: str) -> ET.Element:
    result = elem.find(tag)
    assert result is not None
    return result


def getvalue(elem: ET.Element, tag: str) -> str:
    e_tag = gettag(elem, tag)
    text = e_tag.text
    return text if text is not None else ""


def getatt(elem: ET.Element, attribute: str) -> str:
    att = elem.get(attribute)
    assert att is not None
    return att


def getflag(elem: ET.Element, tag: str) -> bool:
    return False if getvalue(elem, tag) == "F" else True
