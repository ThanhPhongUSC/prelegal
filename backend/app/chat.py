"""LLM chat for drafting legal documents, via LiteLLM over OpenRouter.

Each turn does two calls against the model: one streams the assistant's plain
reply for a responsive chat, and one extracts the in-progress document (chosen
type plus cover-page fields) from the conversation so the live preview always
reflects everything said.
"""

import json
from collections.abc import Iterator

import litellm

from app.document import DocumentDraft, chat_system_prompt, extract_system_prompt

MODEL = "openrouter/openai/gpt-oss-120b:free"

# Conversation message: {"role": "user" | "assistant", "content": str}
Message = dict[str, str]

_SCHEMA = json.dumps(DocumentDraft.model_json_schema())


def stream_reply(messages: list[Message]) -> Iterator[str]:
    """Yield the assistant's reply as plain-text chunks."""
    response = litellm.completion(
        model=MODEL,
        messages=[{"role": "system", "content": chat_system_prompt()}, *messages],
        stream=True,
    )
    for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


def extract_draft(messages: list[Message]) -> DocumentDraft:
    """Extract the current document draft from the whole conversation.

    The free model/provider does not reliably honor ``response_format``, so the
    schema and a JSON-only instruction are given in the prompt, then the JSON
    object is parsed defensively from the reply.
    """
    system = (
        f"{extract_system_prompt()}\n\nReturn ONLY a JSON object, no prose, no "
        f"markdown, no code fences, matching this schema:\n{_SCHEMA}"
    )
    response = litellm.completion(
        model=MODEL,
        messages=[{"role": "system", "content": system}, *messages],
    )
    return DocumentDraft.model_validate(_parse_json(response.choices[0].message.content))


def _parse_json(content: str) -> dict:
    """Parse the JSON object from model output, tolerating surrounding text."""
    start = content.find("{")
    end = content.rfind("}")
    return json.loads(content[start : end + 1])
