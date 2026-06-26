import { Fragment, type ReactNode } from "react";
import {
  ATTRIBUTION,
  STANDARD_TERMS,
  formatConfidentiality,
  formatEffectiveDate,
  formatMndaTerm,
  interpolationValues,
  type ConfidentialityChoice,
  type NdaData,
  type PartyDetails,
  type TermChoice,
} from "@/lib/nda";

/**
 * Renders Standard Terms body text, replacing tokens with bolded content:
 *   `{{field}}`        -> value from `values`
 *   `[[Defined Term]]` -> the term name, verbatim
 */
function renderTokens(body: string, values: Record<string, string>): ReactNode {
  const parts = body.split(/(\{\{[^}]+\}\}|\[\[[^\]]+\]\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const key = part.slice(2, -2);
      return <strong key={i}>{values[key] ?? part}</strong>;
    }
    if (part.startsWith("[[") && part.endsWith("]]")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** A labelled value used throughout the Cover Page. */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-bold">{label}</h3>
      {hint && <p className="text-sm italic text-gray-500">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

// Seamless inputs used when the document is editable. Print CSS strips their
// chrome (see globals.css) so the printed PDF still reads as plain text.
const editInput =
  "editable-field w-full rounded border border-dashed border-gray-300 bg-white px-2 py-1 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary";
const editSelect = `${editInput} w-auto`;
const editNumber = `${editInput} w-16`;

function clampYears(value: string): number {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 1 : Math.max(1, n);
}

/** One party's column in the signature block — editable input or plain text. */
function PartyCell({
  party,
  field,
  onChange,
}: {
  party: PartyDetails;
  field: keyof PartyDetails;
  onChange?: (field: keyof PartyDetails, value: string) => void;
}) {
  if (!onChange) {
    return <span className="whitespace-pre-wrap">{party[field] || " "}</span>;
  }
  if (field === "noticeAddress") {
    return (
      <textarea
        aria-label="Notice Address"
        rows={2}
        className={editInput}
        value={party[field]}
        onChange={(e) => onChange(field, e.target.value)}
      />
    );
  }
  return (
    <input
      aria-label={field}
      className={editInput}
      value={party[field]}
      onChange={(e) => onChange(field, e.target.value)}
    />
  );
}

export default function NdaDocument({
  data,
  onChange,
}: {
  data: NdaData;
  onChange?: (data: NdaData) => void;
}) {
  const values = interpolationValues(data);
  const editable = !!onChange;
  const set = <K extends keyof NdaData>(key: K, value: NdaData[K]) =>
    onChange?.({ ...data, [key]: value });
  const setParty = (party: "party1" | "party2", field: keyof PartyDetails, value: string) =>
    onChange?.({ ...data, [party]: { ...data[party], [field]: value } });

  const signatureRows: { label: string; field?: keyof PartyDetails }[] = [
    { label: "Signature" },
    { label: "Print Name", field: "printName" },
    { label: "Title", field: "title" },
    { label: "Company", field: "company" },
    { label: "Notice Address", field: "noticeAddress" },
    { label: "Date" },
  ];

  return (
    <article className="nda-document font-serif text-[15px] leading-relaxed text-gray-900">
      {/* ---- Cover Page ---- */}
      <h1 className="mb-1 text-2xl font-bold">Mutual Non-Disclosure Agreement</h1>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-600">
        Cover Page
      </h2>

      <p className="mb-6 text-sm">
        This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“
        <strong>Cover Page</strong>”) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0
        (“<strong>Standard Terms</strong>”). Any modifications of the Standard Terms should be made
        on this Cover Page, which will control over conflicts with the Standard Terms.
      </p>

      <Field label="Purpose" hint="How Confidential Information may be used">
        {editable ? (
          <textarea
            aria-label="Purpose"
            rows={3}
            className={editInput}
            value={data.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          />
        ) : (
          data.purpose || "[Describe the purpose]"
        )}
      </Field>

      <Field label="Effective Date">
        {editable ? (
          <input
            type="date"
            aria-label="Effective Date"
            className={editSelect}
            value={data.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        ) : (
          formatEffectiveDate(data.effectiveDate)
        )}
      </Field>

      <Field label="MNDA Term" hint="The length of this MNDA">
        {editable ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="MNDA Term type"
              className={editSelect}
              value={data.mndaTermChoice}
              onChange={(e) => set("mndaTermChoice", e.target.value as TermChoice)}
            >
              <option value="duration">Expires after</option>
              <option value="openEnded">Continues until terminated</option>
            </select>
            {data.mndaTermChoice === "duration" && (
              <>
                <input
                  type="number"
                  min={1}
                  aria-label="MNDA Term years"
                  className={editNumber}
                  value={data.mndaTermYears}
                  onChange={(e) => set("mndaTermYears", clampYears(e.target.value))}
                />
                <span>year(s) from the Effective Date</span>
              </>
            )}
          </div>
        ) : (
          formatMndaTerm(data)
        )}
      </Field>

      <Field label="Term of Confidentiality" hint="How long Confidential Information is protected">
        {editable ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Confidentiality type"
              className={editSelect}
              value={data.confidentialityChoice}
              onChange={(e) =>
                set("confidentialityChoice", e.target.value as ConfidentialityChoice)
              }
            >
              <option value="duration">Expires after</option>
              <option value="perpetual">In perpetuity</option>
            </select>
            {data.confidentialityChoice === "duration" && (
              <>
                <input
                  type="number"
                  min={1}
                  aria-label="Confidentiality years"
                  className={editNumber}
                  value={data.confidentialityYears}
                  onChange={(e) => set("confidentialityYears", clampYears(e.target.value))}
                />
                <span>year(s) from the Effective Date</span>
              </>
            )}
          </div>
        ) : (
          formatConfidentiality(data)
        )}
      </Field>

      <Field label="Governing Law & Jurisdiction">
        {editable ? (
          <div className="space-y-2">
            <input
              aria-label="Governing Law"
              placeholder="Governing Law (State)"
              className={editInput}
              value={data.governingLaw}
              onChange={(e) => set("governingLaw", e.target.value)}
            />
            <input
              aria-label="Jurisdiction"
              placeholder="Jurisdiction (city/county and state)"
              className={editInput}
              value={data.jurisdiction}
              onChange={(e) => set("jurisdiction", e.target.value)}
            />
          </div>
        ) : (
          <>
            <p>Governing Law: {values.governingLaw}</p>
            <p>Jurisdiction: {values.jurisdiction}</p>
          </>
        )}
      </Field>

      <Field label="MNDA Modifications" hint="List any modifications to the MNDA">
        {editable ? (
          <textarea
            aria-label="MNDA Modifications"
            rows={2}
            placeholder="None."
            className={editInput}
            value={data.modifications}
            onChange={(e) => set("modifications", e.target.value)}
          />
        ) : (
          <span className="whitespace-pre-wrap">{data.modifications || "None."}</span>
        )}
      </Field>

      <p className="mb-4 text-sm">
        By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective
        Date.
      </p>

      <table className="mb-8 w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-1/4 border border-gray-400 bg-gray-50 p-2 text-left"></th>
            <th className="border border-gray-400 bg-gray-50 p-2 text-left">Party 1</th>
            <th className="border border-gray-400 bg-gray-50 p-2 text-left">Party 2</th>
          </tr>
        </thead>
        <tbody>
          {signatureRows.map((row) => (
            <tr key={row.label}>
              <td className="border border-gray-400 p-2 font-semibold">{row.label}</td>
              <td className="border border-gray-400 p-2">
                {row.field ? (
                  <PartyCell
                    party={data.party1}
                    field={row.field}
                    onChange={editable ? (f, v) => setParty("party1", f, v) : undefined}
                  />
                ) : (
                  " "
                )}
              </td>
              <td className="border border-gray-400 p-2">
                {row.field ? (
                  <PartyCell
                    party={data.party2}
                    field={row.field}
                    onChange={editable ? (f, v) => setParty("party2", f, v) : undefined}
                  />
                ) : (
                  " "
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---- Standard Terms ---- */}
      <div className="nda-page-break">
        <h2 className="mb-4 text-xl font-bold">Standard Terms</h2>
        <ol className="space-y-4">
          {STANDARD_TERMS.map((section) => (
            <li key={section.n} className="text-justify">
              <strong>
                {section.n}. {section.title}.
              </strong>{" "}
              {renderTokens(section.body, values)}
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-8 text-xs text-gray-500">{ATTRIBUTION}</p>
    </article>
  );
}
