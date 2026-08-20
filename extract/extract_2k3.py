import logging
import os
import xml.etree.ElementTree as ET

from argparse import Namespace
from pathlib import Path
from extract.utils import *

logger = logging.getLogger(__name__)


def do_2k3(args: Namespace) -> None:
    in_path = Path(args.directory)
    out_path = Path(args.output)
    os.makedirs(out_path, exist_ok=True)

    # region read map names
    logger.info("loading map names")
    map_names: dict[int, str] = {}
    emt = ET.parse(in_path / "RPG_RT.emt")
    for map_info in emt.getroot()[0][0]:
        map_names[int(geta(map_info, "id"))] = getv(map_info, "name")
    del map_names[0]  # exclude ID 0 because it's not really a map
    del emt

    if not args.dry_run:
        with open(out_path / "maps.json", "w") as file:
            save(map_names, file, args.pretty)
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
        out = {"name": map_name, "id": map_id, "events": out_events}

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
