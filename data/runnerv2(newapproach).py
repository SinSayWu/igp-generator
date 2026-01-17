

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from openai import OpenAI

def load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_prompt(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

SYSTEM_PROMPT = load_prompt("prompts/system_prompt_v6.md")



def build_payload(
    *,
    student: Dict[str, Any],
    graduation_requirements: List[Dict[str, Any]],
    class_catalog: Dict[str, Any],
    plan_years_ahead: int = 4,
) -> Dict[str, Any]:
    """
    One authoritative payload object for the model.
    """
    return {
        "plan_years_ahead": plan_years_ahead,
        "student": student,
        "graduation_requirements": graduation_requirements,
        "class_catalog": class_catalog,
    }


def _safe_json_loads(text: str) -> Dict[str, Any]:
    """
    Parses JSON even if the model wraps it in ```json ... ``` fences
    or appends extra text after the JSON.
    """
    if text is None:
        raise ValueError("Model returned no text (None).")

    t = text.strip()
    if not t:
        raise ValueError("Model returned empty text.")

    # Strip markdown code fences if present
    if t.startswith("```"):
        first_nl = t.find("\n")
        if first_nl != -1:
            t = t[first_nl + 1 :]
        t = t.strip()
        if t.endswith("```"):
            t = t[:-3].strip()

    # Fast path: already pure JSON
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        pass

    # Robust path: extract the first complete JSON object from the text
    start = t.find("{")
    if start == -1:
        raise ValueError(
            "Model did not return JSON (no '{' found).\n"
            f"Raw text (first 1000 chars):\n{t[:1000]}"
        )

    in_str = False
    escape = False
    depth = 0
    end = None

    for i in range(start, len(t)):
        ch = t[i]

        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
            continue
        else:
            if ch == '"':
                in_str = True
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break

    if end is None:
        raise ValueError(
            "Model output contained '{' but no complete JSON object was found.\n"
            f"Raw text (first 1000 chars):\n{t[:1000]}"
        )

    json_str = t[start:end]
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(
            "Model returned text containing JSON, but parsing still failed.\n"
            f"JSON error: {e}\n"
            f"Extracted JSON (first 1000 chars):\n{json_str[:1000]}\n"
            f"Raw text (first 1000 chars):\n{t[:1000]}"
        )



# ----------------------------
# 2) OpenAI call
# ----------------------------

def generate_plan_with_chatgpt(
    payload: Dict[str, Any],
    *,
    model: str = "gpt-5",   # change if you prefer another available model
    temperature: float = 0.4,
) -> Dict[str, Any]:
    """
    Calls the OpenAI API and returns the parsed JSON plan dict.
    """

    client = OpenAI(api_key="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")

    # Using Responses API (recommended going forward)
    resp = client.responses.create(
        model=model,
        temperature=temperature,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload)},
        ],
    )

    # Get the model's text output (Responses API)
    # The SDK provides resp.output_text convenience in newer versions.
    text = getattr(resp, "output_text", None)
    if not text:
        # Fallback: attempt to reconstruct from output items
        # (This keeps it robust across minor SDK changes.)
        chunks: List[str] = []
        for item in resp.output or []:
            for c in getattr(item, "content", []) or []:
                if getattr(c, "type", None) in ("output_text", "text"):
                    chunks.append(getattr(c, "text", ""))
        text = "".join(chunks).strip()

    if not text:
        raise RuntimeError("No text returned from the model.")

    return _safe_json_loads(text)


# ----------------------------
# 3) Printing / “output everything”
# ----------------------------

from typing import Dict, Any
from tabulate import tabulate

from typing import Dict, Any

def print_plan_everything(plan: Dict[str, Any]) -> None:
    def row(cols, widths):
        return " | ".join(str(c).ljust(w) for c, w in zip(cols, widths))

    headers = [
        "Slot", "Slot Cr", "Course ID", "Course Title",
        "Subject", "Course Cr", "Fulfills"
    ]
    widths = [6, 8, 15, 30, 12, 10, 20]

    print("\n================ PLAN OVERVIEW ================\n")
    print(plan.get("plan_overview", "(no overview)"))

    print("\n================ MULTI-YEAR PLAN ================\n")

    for year in plan.get("multi_year_plan", []):
        grade = year.get("grade")
        print(f"\n----- Grade {grade} -----")
        print(row(headers, widths))
        print("-" * (sum(widths) + 3 * (len(widths) - 1)))

        slots = sorted(year.get("slots", []), key=lambda s: s.get("slot", 0))
        for slot in slots:
            for c in slot.get("courses", []):
                print(row([
                    slot.get("slot"),
                    slot.get("slot_credits"),
                    c.get("course_id"),
                    c.get("course_title"),
                    c.get("subject"),
                    c.get("credits"),
                    ", ".join(c.get("fulfills", []) or [])
                ], widths))

    print("\n================ RATIONALE ================\n")
    for r in plan.get("rationale", []) or []:
        print(f"- {r}")



def run_end_to_end(
    *,
    student: Dict[str, Any],
    graduation_requirements: List[Dict[str, Any]],
    class_catalog: Dict[str, Any],
    plan_years_ahead: int = 4,
    model: str = "gpt-5",
) -> Dict[str, Any]:
    """
    One function that:
    - builds payload
    - calls the model
    - prints everything
    - returns the full JSON plan dict
    """
    payload = build_payload(
        student=student,
        graduation_requirements=graduation_requirements,
        class_catalog=class_catalog,
        plan_years_ahead=plan_years_ahead,
    )
    plan = generate_plan_with_chatgpt(payload, model=model)
    print_plan_everything(plan)
    return plan


# ----------------------------
# 4) Example usage (drop in your data)
# ----------------------------
if __name__ == "__main__":
   

    CLASS_CATALOG = load_json("data/schools/dwd_daniel_hs/classesv3.json")

    GRAD_REQS = load_json("data/schools/dwd_daniel_hs/graduation_reqs.json")
    

    STUDENT = load_json("data/students_v1.json")

    # Example: plan for 4 years ahead (grade 9-12 if student grade is 8)
    print("started")
    run_end_to_end(
        student=STUDENT,
        graduation_requirements=GRAD_REQS,
        class_catalog=CLASS_CATALOG,
        plan_years_ahead=4,
        model="gpt-4o-mini",
    )
