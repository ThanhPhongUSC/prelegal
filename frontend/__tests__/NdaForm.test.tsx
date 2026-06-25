import { describe, it, expect } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "@/components/NdaForm";
import { defaultNdaData, type NdaData } from "@/lib/nda";

/**
 * Stateful harness so the controlled form behaves as it does in the app:
 * onChange updates state, which feeds back into the inputs. `latest` exposes
 * the most recent data object for assertions.
 */
function renderForm() {
  const ref: { latest: NdaData } = { latest: defaultNdaData };
  function Harness() {
    const [data, setData] = useState<NdaData>(defaultNdaData);
    ref.latest = data;
    return (
      <NdaForm
        data={data}
        onChange={(d) => {
          ref.latest = d;
          setData(d);
        }}
      />
    );
  }
  render(<Harness />);
  return ref;
}

describe("NdaForm", () => {
  it("renders the default purpose value", () => {
    renderForm();
    expect(screen.getByText("Purpose")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/business relationship/i)).toBeInTheDocument();
  });

  it("captures typed governing law and jurisdiction", async () => {
    const user = userEvent.setup();
    const ref = renderForm();

    await user.type(screen.getByLabelText("Governing Law (State)"), "Delaware");
    await user.type(
      screen.getByLabelText("Jurisdiction (city/county and state)"),
      "New Castle County, Delaware",
    );

    expect(ref.latest.governingLaw).toBe("Delaware");
    expect(ref.latest.jurisdiction).toBe("New Castle County, Delaware");
  });

  it("disables the MNDA term-years input when the open-ended option is chosen", async () => {
    const user = userEvent.setup();
    renderForm();

    const yearsInput = screen.getAllByRole("spinbutton")[0];
    expect(yearsInput).not.toBeDisabled();

    await user.click(
      screen.getByLabelText(/Continues until terminated under the terms of the MNDA/),
    );
    // First spinbutton is the MNDA term years field.
    expect(screen.getAllByRole("spinbutton")[0]).toBeDisabled();
  });

  it("disables the confidentiality-years input when perpetual is chosen", async () => {
    const user = userEvent.setup();
    const ref = renderForm();

    await user.click(screen.getByLabelText(/In perpetuity/));

    expect(ref.latest.confidentialityChoice).toBe("perpetual");
    expect(screen.getAllByRole("spinbutton")[1]).toBeDisabled();
  });

  it("accepts a multi-digit year and ignores empty or decimal input", () => {
    const ref = renderForm();
    const years = screen.getAllByRole("spinbutton")[0];

    fireEvent.change(years, { target: { value: "20" } });
    expect(ref.latest.mndaTermYears).toBe(20);

    // Clearing the field is ignored rather than snapping back to 1.
    fireEvent.change(years, { target: { value: "" } });
    expect(ref.latest.mndaTermYears).toBe(20);

    // Decimal input is coerced to a whole number.
    fireEvent.change(years, { target: { value: "2.5" } });
    expect(ref.latest.mndaTermYears).toBe(2);
  });

  it("updates party fields independently", async () => {
    const user = userEvent.setup();
    const ref = renderForm();

    const companyInputs = screen.getAllByLabelText("Company");
    await user.type(companyInputs[0], "Acme Inc");

    expect(ref.latest.party1.company).toBe("Acme Inc");
    expect(ref.latest.party2.company).toBe("");
  });

  it("keeps focus while typing into a party field (no remount)", async () => {
    const user = userEvent.setup();
    renderForm();

    const printNameInputs = screen.getAllByLabelText("Print Name");
    const party1Name = printNameInputs[0];
    party1Name.focus();
    await user.keyboard("Ada Lovelace");

    expect(document.activeElement).toBe(party1Name);
    expect((party1Name as HTMLInputElement).value).toBe("Ada Lovelace");
  });
});
