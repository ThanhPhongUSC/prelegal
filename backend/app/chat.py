"""LLM chat for drafting the Mutual NDA, via LiteLLM over OpenRouter.

Each turn does two calls against the model: one streams the assistant's plain
reply for a responsive chat, and one extracts the full set of NDA fields from the
conversation so far so the live preview always reflects everything said.
"""

import json
from collections.abc import Iterator

import litellm

from app.nda import CHAT_SYSTEM_PROMPT, EXTRACT_SYSTEM_PROMPT, NdaFields

_SCHEMA = json.dumps(NdaFields.model_json_schema())

MODEL = "openrouter/openai/gpt-oss-120b:free"

# Conversation message: {"role": "user" | "assistant", "content": str}
Message = dict[str, str]


def stream_reply(messages: list[Message]) -> Iterator[str]:
    """Yield the assistant's reply as plain-text chunks."""
    response = litellm.completion(
        model=MODEL,
        messages=[{"role": "system", "content": CHAT_SYSTEM_PROMPT}, *messages],
        stream=True,
    )
    for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


def extract_fields(messages: list[Message]) -> NdaFields:
    """Extract the current best-known NDA fields from the whole conversation.

    The free model/provider does not reliably honor ``response_format``, so the
    schema and a JSON-only instruction are given in the prompt, then the JSON
    object is parsed defensively from the reply.
    """
    system = (
        f"{EXTRACT_SYSTEM_PROMPT}\n\nReturn ONLY a JSON object, no prose, no "
        f"markdown, no code fences, matching this schema:\n{_SCHEMA}"
    )
    response = litellm.completion(
        model=MODEL,
        messages=[{"role": "system", "content": system}, *messages],
    )
    return NdaFields.model_validate(_parse_json(response.choices[0].message.content))


def _parse_json(content: str) -> dict:
    """Parse the JSON object from model output, tolerating surrounding text."""
    start = content.find("{")
    end = content.rfind("}")
    return json.loads(content[start : end + 1])
