import { defaultNdaData, type NdaData } from "@/lib/nda";

/** Builds an NdaData object from the defaults with the given overrides. */
export const make = (overrides: Partial<NdaData> = {}): NdaData => ({
  ...defaultNdaData,
  ...overrides,
});
