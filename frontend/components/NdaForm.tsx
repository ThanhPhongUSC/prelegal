"use client";

import type { ChangeEvent, ReactNode } from "react";
import type { NdaData, PartyDetails } from "@/lib/nda";

interface NdaFormProps {
  data: NdaData;
  onChange: (data: NdaData) => void;
}

const labelClass = "block text-sm font-medium text-gray-700";
const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type="text"
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-gray-200 pt-5">
      <legend className="text-base font-semibold text-gray-900">{title}</legend>
      {children}
    </fieldset>
  );
}

/** The four fields describing a single signing party. */
function PartyFields({
  party,
  onChange,
}: {
  party: PartyDetails;
  onChange: (field: keyof PartyDetails, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Print Name"
        value={party.printName}
        onChange={(v) => onChange("printName", v)}
      />
      <TextField label="Title" value={party.title} onChange={(v) => onChange("title", v)} />
      <TextField label="Company" value={party.company} onChange={(v) => onChange("company", v)} />
      <label className="block">
        <span className={labelClass}>Notice Address</span>
        <textarea
          className={inputClass}
          rows={2}
          value={party.noticeAddress}
          placeholder="Email or postal address"
          onChange={(e) => onChange("noticeAddress", e.target.value)}
        />
      </label>
    </div>
  );
}

export default function NdaForm({ data, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaData>(key: K, value: NdaData[K]) =>
    onChange({ ...data, [key]: value });

  const setParty = (
    party: "party1" | "party2",
    field: keyof PartyDetails,
    value: string,
  ) => onChange({ ...data, [party]: { ...data[party], [field]: value } });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Section title="Agreement Details">
        <label className="block">
          <span className={labelClass}>Purpose</span>
          <textarea
            className={inputClass}
            rows={3}
            value={data.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          />
          <span className="text-xs text-gray-500">How Confidential Information may be used.</span>
        </label>

        <label className="block">
          <span className={labelClass}>Effective Date</span>
          <input
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </label>
      </Section>

      <Section title="MNDA Term">
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mndaTerm"
              checked={data.mndaTermChoice === "duration"}
              onChange={() => set("mndaTermChoice", "duration")}
            />
            <span>Expires</span>
            <input
              type="number"
              min={1}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 disabled:bg-gray-100"
              value={data.mndaTermYears}
              disabled={data.mndaTermChoice !== "duration"}
              onChange={(e) => set("mndaTermYears", Math.max(1, Number(e.target.value) || 1))}
            />
            <span>year(s) from the Effective Date</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mndaTerm"
              checked={data.mndaTermChoice === "openEnded"}
              onChange={() => set("mndaTermChoice", "openEnded")}
            />
            <span>Continues until terminated under the terms of the MNDA</span>
          </label>
        </div>
      </Section>

      <Section title="Term of Confidentiality">
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="confidentiality"
              checked={data.confidentialityChoice === "duration"}
              onChange={() => set("confidentialityChoice", "duration")}
            />
            <input
              type="number"
              min={1}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 disabled:bg-gray-100"
              value={data.confidentialityYears}
              disabled={data.confidentialityChoice !== "duration"}
              onChange={(e) =>
                set("confidentialityYears", Math.max(1, Number(e.target.value) || 1))
              }
            />
            <span>year(s) from the Effective Date (trade secrets: until no longer a trade secret)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="confidentiality"
              checked={data.confidentialityChoice === "perpetual"}
              onChange={() => set("confidentialityChoice", "perpetual")}
            />
            <span>In perpetuity</span>
          </label>
        </div>
      </Section>

      <Section title="Governing Law & Jurisdiction">
        <TextField
          label="Governing Law (State)"
          value={data.governingLaw}
          placeholder="e.g. Delaware"
          onChange={(v) => set("governingLaw", v)}
        />
        <TextField
          label="Jurisdiction (city/county and state)"
          value={data.jurisdiction}
          placeholder="e.g. New Castle County, Delaware"
          onChange={(v) => set("jurisdiction", v)}
        />
        <label className="block">
          <span className={labelClass}>MNDA Modifications</span>
          <textarea
            className={inputClass}
            rows={2}
            value={data.modifications}
            placeholder="List any modifications to the MNDA (leave blank for none)"
            onChange={(e) => set("modifications", e.target.value)}
          />
        </label>
      </Section>

      <Section title="Party 1">
        <PartyFields
          party={data.party1}
          onChange={(field, value) => setParty("party1", field, value)}
        />
      </Section>

      <Section title="Party 2">
        <PartyFields
          party={data.party2}
          onChange={(field, value) => setParty("party2", field, value)}
        />
      </Section>
    </form>
  );
}
