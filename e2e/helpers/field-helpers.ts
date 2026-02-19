/**
 * Field interaction helpers — locate and interact with all 12 field types
 * in the assessment form.
 *
 * Since field IDs are UUIDs (e.g., `#field-<uuid>`), these helpers locate
 * fields by their item code text (e.g., "TL01") and interact with the
 * nearest input/control.
 */

import type { Page, Locator } from "@playwright/test";

/**
 * Locate the field container for an item by its code (e.g. "TL01").
 * The code is displayed in a `.font-mono` span within the item's wrapper.
 */
export function locateFieldByCode(page: Page, itemCode: string): Locator {
  // The item code is in a <span> with font-mono class. Go up to the group container.
  return page
    .locator(".group")
    .filter({ has: page.locator(`text="${itemCode}"`) });
}

/**
 * Get the input area within a field container (works for most simple types).
 */
function getInput(container: Locator): Locator {
  return container.locator("input, textarea, select").first();
}

// ---------------------------------------------------------------------------
// Field type interactions
// ---------------------------------------------------------------------------

export async function fillShortText(
  page: Page,
  itemCode: string,
  value: string
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  const input = container.locator("input[type='text'], input:not([type])").first();
  await input.fill(value);
}

export async function fillLongText(
  page: Page,
  itemCode: string,
  value: string
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  const textarea = container.locator("textarea").first();
  await textarea.fill(value);
}

export async function fillNumeric(
  page: Page,
  itemCode: string,
  value: number
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  const input = container.locator("input[type='number']").first();
  await input.fill(String(value));
}

export async function fillPercentage(
  page: Page,
  itemCode: string,
  value: number
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  const input = container.locator("input[type='number']").first();
  await input.fill(String(value));
}

export async function selectDropdown(
  page: Page,
  itemCode: string,
  optionValue: string
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  const select = container.locator("select").first();
  await select.selectOption(optionValue);
}

export async function clickMultiSelect(
  page: Page,
  itemCode: string,
  labels: string[]
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  for (const label of labels) {
    await container.locator("label").filter({ hasText: label }).click();
  }
}

export async function selectYesNo(
  page: Page,
  itemCode: string,
  answer: "Yes" | "No",
  details?: string
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  // Click the Yes/No button
  await container
    .locator("button")
    .filter({ hasText: answer })
    .click();

  // If "Yes" and details provided, fill the details textarea
  if (answer === "Yes" && details) {
    const textarea = container.locator("textarea").first();
    await textarea.fill(details);
  }
}

export async function fillMultiYearGender(
  page: Page,
  itemCode: string,
  data: Record<string, Record<string, number>>
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  // Data shape: { "2023": { "male": 100, "female": 120 }, ... }
  // Grid inputs are identified by row/column position
  const inputs = container.locator("input[type='number']");
  const count = await inputs.count();
  // Fill sequentially — inputs are laid out in year×gender order
  for (let i = 0; i < count && i < Object.keys(data).length * 3; i++) {
    await inputs.nth(i).fill("50");
  }
}

export async function uploadFile(
  page: Page,
  itemCode: string,
  filePath: string
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  const fileInput = container.locator("input[type='file']");
  await fileInput.setInputFiles(filePath);
}

export async function fillSalaryBands(
  page: Page,
  itemCode: string,
  bands: { min: number; max: number; median: number }[]
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  const inputs = container.locator("input[type='number']");
  let idx = 0;
  for (const band of bands) {
    if (idx < (await inputs.count())) {
      await inputs.nth(idx++).fill(String(band.min));
    }
    if (idx < (await inputs.count())) {
      await inputs.nth(idx++).fill(String(band.max));
    }
    if (idx < (await inputs.count())) {
      await inputs.nth(idx++).fill(String(band.median));
    }
  }
}

export async function assertAutoCalculated(
  page: Page,
  itemCode: string
): Promise<string> {
  const container = locateFieldByCode(page, itemCode);
  // Auto-calculated fields are read-only — get displayed value
  const display = container.locator('[class*="bg-slate"]').first();
  return (await display.textContent()) ?? "";
}

export async function selectPartnerSpecific(
  page: Page,
  itemCode: string,
  partnerName: string,
  value: string
): Promise<void> {
  const container = locateFieldByCode(page, itemCode);
  // Select partner from dropdown
  const select = container.locator("select").first();
  await select.selectOption({ label: partnerName });
  // Fill value
  const input = container.locator("input, textarea").last();
  await input.fill(value);
}

// ---------------------------------------------------------------------------
// Generic fill based on field type
// ---------------------------------------------------------------------------

export type FieldType =
  | "short_text"
  | "long_text"
  | "numeric"
  | "percentage"
  | "yes_no_conditional"
  | "dropdown"
  | "multi_select"
  | "file_upload"
  | "multi_year_gender"
  | "partner_specific"
  | "auto_calculated"
  | "salary_bands";

/**
 * Fill a field by code and type with a sensible default value.
 * Useful for bulk-filling forms in lifecycle tests.
 */
export async function fillFieldByType(
  page: Page,
  itemCode: string,
  fieldType: FieldType,
  value?: unknown
): Promise<void> {
  switch (fieldType) {
    case "short_text":
      await fillShortText(page, itemCode, (value as string) || `Sample response for ${itemCode}`);
      break;
    case "long_text":
      await fillLongText(page, itemCode, (value as string) || `Detailed response for ${itemCode}. This provides comprehensive information about the assessment criteria.`);
      break;
    case "numeric":
      await fillNumeric(page, itemCode, (value as number) || 75);
      break;
    case "percentage":
      await fillPercentage(page, itemCode, (value as number) || 85);
      break;
    case "yes_no_conditional":
      await selectYesNo(page, itemCode, "Yes", `Details for ${itemCode}`);
      break;
    case "dropdown":
      // Try to select the first non-empty option
      try {
        const container = locateFieldByCode(page, itemCode);
        const select = container.locator("select").first();
        const options = select.locator("option");
        const count = await options.count();
        if (count > 1) {
          const val = await options.nth(1).getAttribute("value");
          if (val) await select.selectOption(val);
        }
      } catch {
        // Dropdown may not have options
      }
      break;
    case "multi_select":
      // Click the first available checkbox
      try {
        const container = locateFieldByCode(page, itemCode);
        const labels = container.locator("label");
        if ((await labels.count()) > 0) {
          await labels.first().click();
        }
      } catch {
        // No options available
      }
      break;
    case "file_upload":
      // Skip in generic fill — requires actual file
      break;
    case "multi_year_gender":
      await fillMultiYearGender(page, itemCode, {});
      break;
    case "salary_bands":
      await fillSalaryBands(page, itemCode, [
        { min: 30000, max: 60000, median: 45000 },
      ]);
      break;
    case "auto_calculated":
      // Read-only — skip
      break;
    case "partner_specific":
      // Requires partner selection — skip in generic fill
      break;
  }
}
