import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any
import re

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/suggestions", tags=["Suggestions"])

OPENAI_API_URL = "https://api.openai.com/v1/responses"
DEFAULT_OPENAI_MODEL = "gpt-5.2"
SUGGESTION_LIMIT = 3


def load_env_file() -> None:
    candidates = [
        Path.cwd() / ".env",
        Path(__file__).resolve().parents[2] / ".env",
        Path(__file__).resolve().parents[3] / ".env",
    ]

    for env_path in candidates:
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def extract_response_text(data: dict[str, Any]) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"]

    for item in data.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]

    return ""


from openai import OpenAI
import os
import json

def call_openai_json(prompt: str, schema: dict[str, any], schema_name: str) -> dict | None:
    # خواندن API key از environment
    api_key = os.getenv("GAPGPT_API_KEY")
    if not api_key:
        print("GAPGPT_API_KEY is missing")
        return None

    # ایجاد کلاینت OpenAI / GAPGPT
    client = OpenAI(
        base_url="https://api.gapgpt.app/v1",  # آدرس API جدید
        api_key=api_key
    )

    try:
        # درخواست chat completion به مدل
        response = client.chat.completions.create(
            model="gpt-4o",  # می‌تونی مدل را عوض کنی
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"تو یک دستیار آرام برای استراتژی هدف هستی. "
                        f"پیشنهادها باید عملی، کم‌فشار و کوتاه باشند. "
                        f"لطفاً خروجی را به صورت JSON مطابق این schema بده:\n{json.dumps(schema)}\n\n"
                        f"متن ورودی: {prompt}"
                    )
                }
            ]
        )

        # متن پاسخ
        text = response.choices[0].message.content
        print("RAW RESPONSE:", text)

        # Strip ```json and ``` from start/end
        cleaned_text = re.sub(r"^```json\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)

        # تلاش برای تبدیل پاسخ به JSON
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            print("JSON decode error:", e)
            return None

    except Exception as e:
        print("Error calling GAPGPT API:", e)
        return None



GOAL_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "suggestions": {
            "type": "array",
            "maxItems": SUGGESTION_LIMIT,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                },
                "required": ["title"],
            },
        }
    },
    "required": ["suggestions"],
}

STEP_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "suggestions": {
            "type": "array",
            "maxItems": SUGGESTION_LIMIT,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "target_value": {"type": "number"},
                    "unit": {"type": "string"},
                },
                "required": ["title", "target_value", "unit"],
            },
        }
    },
    "required": ["suggestions"],
}


def fallback_goal_suggestions(concern: str) -> list[dict[str, str]]:
    clean_concern = concern.strip()
    return [
        {"title": f"کمی سبک‌تر کردن: {clean_concern[:55]}"},
        {"title": "هر روز یک قدم کوچک و قابل انجام بردارم"},
        {"title": "برای این نگرانی یک روال آرام و کوتاه بسازم"},
    ]


def fallback_step_suggestions(goal_title: str, concern: str | None) -> list[dict[str, float | str]]:
    context_title = goal_title.strip() or "این هدف"
    context_concern = concern.strip() if concern else ""
    first_title = (
        f"یک قدم کوچک برای {context_concern[:42]}"
        if context_concern
        else f"یک شروع کوتاه برای {context_title[:48]}"
    )

    return [
        {
            "title": first_title,
            "target_value": 10,
            "unit": "دقیقه",
        },
        {
            "title": f"یک بار نزدیک‌تر شدن به {context_title[:46]}",
            "target_value": 2,
            "unit": "بار",
        },
        {
            "title": "مرور آرام و تنظیم قدم بعدی",
            "target_value": 3,
            "unit": "بار",
        },
    ]


def normalize_goal_suggestions(items: list[dict[str, Any]]) -> list[dict[str, str]]:
    normalized = []
    for item in items:
        if len(normalized) >= SUGGESTION_LIMIT:
            break
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()
        if not title:
            continue
        normalized.append({"title": title[:120]})

    return normalized


def normalize_step_suggestions(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for item in items:
        if len(normalized) >= SUGGESTION_LIMIT:
            break
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()
        unit = str(item.get("unit", "")).strip()
        try:
            target_value = float(item.get("target_value", 0))
        except (TypeError, ValueError):
            continue
        if not title or not unit or target_value <= 0:
            continue

        normalized.append(
            {
                "title": title[:120],
                "target_value": target_value,
                "unit": unit[:40],
            }
        )

    return normalized


def get_default_concern_text(db: Session, user: models.User) -> str | None:
    concern = (
        db.query(models.Concern)
        .filter(models.Concern.user_id == user.id)
        .order_by(models.Concern.created_at.asc())
        .first()
    )
    return concern.text if concern else None


@router.post("/goals", response_model=schemas.GoalSuggestionResponse)
def suggest_goals(
    data: schemas.GoalSuggestionRequest,
    user: models.User = Depends(get_current_user),
):
    prompt = (
        "بر اساس نگرانی کاربر، حداکثر ۳ مسیر یا قدم کوچک و عملی پیشنهاد بده. فقط عنوان کوتاه و واضح هر قدم را بده. هیچ عدد، زمان یا واحدی وارد نکن. قدم‌ها کم‌فشار باشند و کاربر حس حرکت کند حتی اگر همه چیز کامل نشود."
        f"نگرانی ها: {data.concern}"
    )

    result = call_openai_json(prompt, GOAL_SCHEMA, "goal_suggestions")
    if result is None:
        return {"suggestions": [], "source": "openai"}

    items = result.get("suggestions")
    if not isinstance(items, list):
        return {"suggestions": [], "source": "openai"}

    return {
        "suggestions": normalize_goal_suggestions(items),
        "source": "openai",
    }


@router.post("/steps", response_model=schemas.StepSuggestionResponse)
def suggest_steps(
    data: schemas.StepSuggestionRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    concern_text = data.concern or get_default_concern_text(db, user)


    prompt = (
        "برای کاربر دقیقا ۳ قدم کوچک و عملی پیشنهاد بده. "
        "پیشنهادها باید مستقیما از ترکیب نگرانی کاربر و هدف انتخاب‌شده ساخته شوند، نه عمومی. "
        "هر قدم باید عنوان کوتاه داشته باشد. "
        "مقدار target_value باید مقدار کل برای چند روز باشد، نه فقط یک روز. "
        "در عنوان یا بازه پیشنهادی روشن کن که مقدار برای چند روز است؛ مثلا تمرین پیانو ۲۰۰ دقیقه در ۵ روز. "
        "قدم‌ها کم‌فشار باشند و کاربر حس پیشرفت کند حتی اگر همه چیز کامل نشود. "
        "خروجی را فقط به صورت JSON مطابق schema بده.\n"
        f"نگرانی کاربر: {concern_text or 'ارائه نشده'}\n"
        f"هدف انتخاب‌شده: {data.goal_title}"
    )


    result = call_openai_json(prompt, STEP_SCHEMA, "step_suggestions")
    if result is None:
        return {"suggestions": [], "source": "openai"}

    items = result.get("suggestions")
    if not isinstance(items, list):
        return {"suggestions": [], "source": "openai"}

    return {
        "suggestions": normalize_step_suggestions(items),
        "source": "openai",
    }
