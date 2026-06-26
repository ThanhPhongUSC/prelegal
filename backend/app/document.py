"""Generic document draft model and AI prompts for any supported document type.

Replaces the NDA-specific model: the assistant now drafts any of the supported
Common Paper document types. A draft is just the chosen document type plus a list
of cover-page fields (label/value pairs) gathered from the conversation; the
Standard Terms themselves are rendered verbatim from the template, never by the
model.
"""

from pydantic import BaseModel, Field

from app import catalog


class CoverField(BaseModel):
    label: str = ""
    value: str = ""


class DocumentDraft(BaseModel):
    """The user's in-progress document: a type plus its cover-page fields."""

    documentType: str = Field(default="", description="Supported document id, or empty")
    fields: list[CoverField] = Field(default_factory=list)


def _catalog_lines() -> str:
    return "\n".join(
        f"- {t['id']}: {t['name']} -- {t['description']}" for t in catalog.supported_types()
    )


def chat_system_prompt() -> str:
    return f"""\
You are Prelegal's drafting assistant. You help the user draft a legal agreement \
through a friendly, freeform chat. You can ONLY draft these document types:

{_catalog_lines()}

Start by greeting the user and asking what kind of agreement they need. Then:
- If they want one of the supported types, confirm it and guide them through it.
- If they want a document we do NOT support, clearly explain that we cannot \
generate that document, then offer the closest supported type from the list above \
and ask if they would like that instead.
- Once a type is chosen, walk through its cover-page details one or two at a time \
so it never feels like a form (for example: the parties and their signers, the \
effective date, term, fees, governing law and jurisdiction, and any specifics the \
document needs).

Always end your reply with a clear follow-up question whenever you still need more \
information to complete the document. Only stop asking once every needed detail is \
captured, then confirm the draft is ready. Let the user know they can also edit \
any field directly in the live preview. Keep replies concise and warm. Never \
output JSON, field names, or the legal text itself -- just talk normally."""


def extract_system_prompt() -> str:
    ids = ", ".join(t["id"] for t in catalog.supported_types())
    return f"""\
You extract the user's in-progress legal document from a conversation with a \
drafting assistant. Determine which supported document type the user has chosen \
and set documentType to its exact id from this list: {ids}. Use an empty string \
if no supported type has been chosen yet.

Extract the cover-page details the user has provided as a list of fields, each \
with a human-readable label and its value (for example {{"label": "Provider", \
"value": "Acme Inc"}}). Use clear labels appropriate to the chosen document type. \
Include only fields the user has actually provided; do not invent values. Return \
the full current set of fields based on everything said so far."""
