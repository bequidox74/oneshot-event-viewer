import json
import xml.etree.ElementTree as ET

from typing import Any


def copy(src: dict, dst: dict, *keys: str):
    for key in keys:
        dst[key] = src[key]


def at(list_: list, i: int) -> Any | None:
    if i < len(list_):
        return list_[i]
    return None


def getint(params: list[dict], i: int) -> int:
    return params[i]["Integer"]


def getstr(params: list, i: int) -> str:
    if isinstance(params[i], str):
        return params[i]
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


def save(what, where, pretty: bool, dry_run: bool) -> None:
    if dry_run:
        return
    indent = 2 if pretty else None
    separators = (",", ": ") if pretty else (",", ":")
    with open(where, "w") as file:
        json.dump(what, file, indent=indent, separators=separators)


def params_to_list(params: list[dict | str]) -> list:
    result = []
    for p in params:
        if isinstance(p, str):  # WME format
            try:
                result.append(int(p))
            except ValueError:
                result.append(p)
        else:  # XP format (jank)
            type_, value = list(p.items())[0]
            match type_:
                case "Integer":
                    result.append(int(value))
                case "String":
                    result.append(value)
                case "Color" | "Tone":
                    result.append(value)
                case "AudioFile":
                    result.append(value)
                case "MoveRoute" | "MoveCommand":
                    result.append(value)
                case "Array":
                    result.append(params_to_list(value))
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
