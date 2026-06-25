import { Fragment, type ReactNode } from "react";
import {
  ATTRIBUTION,
  STANDARD_TERMS,
  formatConfidentiality,
  formatEffectiveDate,
  formatMndaTerm,
  interpolationValues,
  type NdaData,
  type PartyDetails,
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

/** A single party's column in the signature block. */
function partyCell(party: PartyDetails, field: keyof PartyDetails) {
  return <span className="whitespace-pre-wrap">{party[field] || " "}</span>;
}

export default function NdaDocument({ data }: { data: NdaData }) {
  const values = interpolationValues(data);

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
        {data.purpose || "[Describe the purpose]"}
      </Field>

      <Field label="Effective Date">{formatEffectiveDate(data.effectiveDate)}</Field>

      <Field label="MNDA Term" hint="The length of this MNDA">
        {formatMndaTerm(data)}
      </Field>

      <Field label="Term of Confidentiality" hint="How long Confidential Information is protected">
        {formatConfidentiality(data)}
      </Field>

      <Field label="Governing Law & Jurisdiction">
        <p>Governing Law: {values.governingLaw}</p>
        <p>Jurisdiction: {values.jurisdiction}</p>
      </Field>

      <Field label="MNDA Modifications" hint="List any modifications to the MNDA">
        <span className="whitespace-pre-wrap">{data.modifications || "None."}</span>
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
                {row.field ? partyCell(data.party1, row.field) : " "}
              </td>
              <td className="border border-gray-400 p-2">
                {row.field ? partyCell(data.party2, row.field) : " "}
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
