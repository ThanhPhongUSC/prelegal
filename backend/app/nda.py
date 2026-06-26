"""Mutual NDA field model and prompts for the AI chat.

`NdaFields` mirrors the frontend `NdaData` shape (see ``frontend/lib/nda.ts``).
The chat extracts these fields from the conversation so the document preview can
be populated as the user talks to the assistant.
"""

from typing import Literal

from pydantic import BaseModel, Field

TermChoice = Literal["duration", "openEnded"]
ConfidentialityChoice = Literal["duration", "perpetual"]


class PartyDetails(BaseModel):
    printName: str = ""
    title: str = ""
    company: str = ""
    noticeAddress: str = ""


class NdaFields(BaseModel):
    """The Cover Page values of a Common Paper Mutual NDA."""

    purpose: str = ""
    effectiveDate: str = Field(default="", description="ISO date yyyy-mm-dd, or empty")
    mndaTermChoice: TermChoice = "duration"
    mndaTermYears: int = 1
    confidentialityChoice: ConfidentialityChoice = "duration"
    confidentialityYears: int = 1
    governingLaw: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: PartyDetails = Field(default_factory=PartyDetails)
    party2: PartyDetails = Field(default_factory=PartyDetails)


CHAT_SYSTEM_PROMPT = """\
You are Prelegal's drafting assistant. You help the user complete a Common Paper \
Mutual Non-Disclosure Agreement (Mutual NDA) through a friendly, freeform chat.

Have a natural conversation. Greet the user, briefly explain you will draft a \
Mutual NDA together, and ask about the details one or two at a time so it never \
feels like a form. Collect:
- Purpose: how the parties may use each other's Confidential Information.
- Effective Date of the agreement.
- MNDA Term: either a number of years, or that it continues until terminated.
- Term of Confidentiality: either a number of years, or in perpetuity.
- Governing Law (a US state) and Jurisdiction (city/county and state).
- Any modifications to the standard terms (optional).
- For each of the two parties: signer's print name, title, company, and a notice \
address (email or postal).

Ask clarifying questions when an answer is ambiguous. Confirm what you captured \
and let the user know they can also edit any field directly in the live preview. \
Keep replies concise and warm. Do not output JSON or field names to the user; \
just talk normally."""


EXTRACT_SYSTEM_PROMPT = """\
You extract Mutual NDA Cover Page fields from a conversation between a user and a \
drafting assistant. Return the current best-known value for every field based on \
everything said so far. Leave a field as its default (empty string, or the \
defaults for choices/years) when it has not been provided. Use ISO format \
(yyyy-mm-dd) for effectiveDate. Only set mndaTermChoice to "openEnded" if the \
user wants the MNDA to continue until terminated; otherwise "duration" with the \
stated number of years. Only set confidentialityChoice to "perpetual" if the \
user wants confidentiality to last forever; otherwise "duration" with the years. \
For each party, printName is the individual signer's full name, company is their \
organization, title is their job title, and noticeAddress is their email or \
postal address. Keep these distinct -- never put the company name in printName."""
