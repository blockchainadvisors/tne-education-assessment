import type { FieldType, Item } from "@/lib/types";
import { ShortTextField } from "./ShortTextField";
import { LongTextField } from "./LongTextField";
import { NumericField } from "./NumericField";
import { PercentageField } from "./PercentageField";
import { YesNoConditionalField } from "./YesNoConditionalField";
import { DropdownField } from "./DropdownField";
import { MultiSelectField } from "./MultiSelectField";
import { FileUploadField } from "./FileUploadField";
import { MultiYearGenderField } from "./MultiYearGenderField";
import { PartnerSpecificField } from "./PartnerSpecificField";
import { AutoCalculatedField } from "./AutoCalculatedField";
import { SalaryBandsField } from "./SalaryBandsField";

export type FieldRendererProps = {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
};

type FieldRendererComponent = React.ComponentType<FieldRendererProps>;

const rendererMap: Record<FieldType, FieldRendererComponent> = {
  short_text: ShortTextField,
  long_text: LongTextField,
  numeric: NumericField,
  percentage: PercentageField,
  yes_no_conditional: YesNoConditionalField,
  dropdown: DropdownField,
  multi_select: MultiSelectField,
  file_upload: FileUploadField,
  multi_year_gender: MultiYearGenderField,
  partner_specific: PartnerSpecificField,
  auto_calculated: AutoCalculatedField,
  salary_bands: SalaryBandsField,
};

/**
 * Returns the appropriate field renderer component for a given field type.
 * Falls back to ShortTextField for unknown types.
 */
export function getFieldRenderer(fieldType: FieldType): FieldRendererComponent {
  return rendererMap[fieldType] || ShortTextField;
}

export {
  ShortTextField,
  LongTextField,
  NumericField,
  PercentageField,
  YesNoConditionalField,
  DropdownField,
  MultiSelectField,
  FileUploadField,
  MultiYearGenderField,
  PartnerSpecificField,
  AutoCalculatedField,
  SalaryBandsField,
};
