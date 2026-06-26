import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import NdaDocument from "@/components/NdaDocument";
import { make } from "./helpers";

describe("NdaDocument", () => {
  it("renders both the Cover Page and the Standard Terms", () => {
    render(<NdaDocument data={make()} />);
    expect(
      screen.getByRole("heading", { name: /Mutual Non-Disclosure Agreement/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Standard Terms$/i })).toBeInTheDocument();
    expect(screen.getByText(/ALL CONFIDENTIAL INFORMATION IS PROVIDED/)).toBeInTheDocument();
  });

  it("shows the user's purpose, parties, and formatted effective date", () => {
    render(
      <NdaDocument
        data={make({
          purpose: "Evaluating a potential acquisition.",
          effectiveDate: "2026-07-02",
          party1: { printName: "Ada Lovelace", title: "CEO", company: "Acme Inc", noticeAddress: "ada@acme.test" },
          party2: { printName: "Alan Turing", title: "CTO", company: "Globex LLC", noticeAddress: "alan@globex.test" },
        })}
      />,
    );
    expect(screen.getByText("Evaluating a potential acquisition.")).toBeInTheDocument();
    expect(screen.getByText("July 2, 2026")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    expect(screen.getByText("Globex LLC")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("interpolates governing law and jurisdiction into the Standard Terms", () => {
    render(
      <NdaDocument
        data={make({ governingLaw: "Delaware", jurisdiction: "New Castle County, Delaware" })}
      />,
    );
    // Appears on the Cover Page and again interpolated in Section 9.
    expect(screen.getAllByText("Delaware").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/New Castle County, Delaware/).length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to placeholders for unfilled fields", () => {
    render(<NdaDocument data={make({ governingLaw: "", jurisdiction: "", modifications: "" })} />);
    expect(screen.getAllByText("[State]").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("None.")).toBeInTheDocument();
  });

  it("renders the open-ended term and perpetual confidentiality choices", () => {
    render(
      <NdaDocument
        data={make({ mndaTermChoice: "openEnded", confidentialityChoice: "perpetual" })}
      />,
    );
    expect(
      screen.getByText(/Continues until terminated in accordance with the terms/),
    ).toBeInTheDocument();
    expect(screen.getByText("In perpetuity.")).toBeInTheDocument();
  });

  it("renders a signature table with a row for each party detail", () => {
    render(<NdaDocument data={make()} />);
    const table = screen.getByRole("table");
    const utils = within(table);
    expect(utils.getByText("Signature")).toBeInTheDocument();
    expect(utils.getByText("Print Name")).toBeInTheDocument();
    expect(utils.getByText("Company")).toBeInTheDocument();
    expect(utils.getByText("Date")).toBeInTheDocument();
    expect(utils.getByRole("columnheader", { name: "Party 1" })).toBeInTheDocument();
    expect(utils.getByRole("columnheader", { name: "Party 2" })).toBeInTheDocument();
  });

  it("includes the Common Paper CC BY 4.0 attribution", () => {
    render(<NdaDocument data={make()} />);
    expect(screen.getByText(/CC BY 4.0/)).toBeInTheDocument();
  });

  describe("editable mode", () => {
    it("renders inputs and reports edits via onChange", () => {
      const onChange = vi.fn();
      render(<NdaDocument data={make()} onChange={onChange} />);

      fireEvent.change(screen.getByLabelText("Purpose"), {
        target: { value: "Evaluate a deal" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: "Evaluate a deal" }),
      );

      fireEvent.change(screen.getByLabelText("Governing Law"), {
        target: { value: "Delaware" },
      });
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ governingLaw: "Delaware" }),
      );
    });

    it("edits a party field nested under the party object", () => {
      const onChange = vi.fn();
      render(<NdaDocument data={make()} onChange={onChange} />);

      const table = screen.getByRole("table");
      const companyInputs = within(table).getAllByLabelText("company");
      fireEvent.change(companyInputs[0], { target: { value: "Acme Inc" } });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ party1: expect.objectContaining({ company: "Acme Inc" }) }),
      );
    });
  });
});
