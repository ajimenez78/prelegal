import { useId, useState, type ReactNode } from "react";
import { yearsUnit, type NdaFormData, type Party } from "@/lib/nda";

interface NdaFormProps {
  data: NdaFormData;
  onChange: <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) => void;
  onPartyChange: (index: 0 | 1, key: keyof Party, value: string) => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {children}
    </label>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="form-group">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

const MIN_YEARS = 1;
const MAX_YEARS = 99;

/**
 * Keeps the typed text locally so the field can be cleared and retyped;
 * only valid whole numbers are passed up, and blur restores the last one.
 */
function YearsInput({
  value,
  label,
  onChange,
  onFocus,
}: {
  value: number;
  label: string;
  onChange: (years: number) => void;
  onFocus: () => void;
}) {
  const [text, setText] = useState(String(value));
  return (
    <input
      type="number"
      inputMode="numeric"
      min={MIN_YEARS}
      max={MAX_YEARS}
      aria-label={label}
      className="years-input"
      value={text}
      onFocus={onFocus}
      onChange={(e) => {
        setText(e.target.value);
        const years = Number(e.target.value);
        if (Number.isInteger(years) && years >= MIN_YEARS && years <= MAX_YEARS) {
          onChange(years);
        }
      }}
      onBlur={() => setText(String(value))}
    />
  );
}

interface TermOption {
  checked: boolean;
  onSelect: () => void;
  /** Text before the optional years input. */
  label: string;
  years?: {
    value: number;
    label: string;
    onChange: (years: number) => void;
    /** Text after the unit, e.g. ", trade secrets for longer". */
    after?: string;
  };
}

/** A labelled group of radio options, some with an inline years input. */
function TermChoice({
  legend,
  hint,
  name,
  options,
}: {
  legend: string;
  hint?: string;
  name: string;
  options: TermOption[];
}) {
  const id = useId();
  return (
    <fieldset className="field">
      <legend className="field-label">{legend}</legend>
      {hint && <p className="field-hint">{hint}</p>}
      <div className="choice-list">
        {options.map((option, i) => (
          <div className="choice" key={i}>
            <input
              type="radio"
              id={`${id}-${i}`}
              name={name}
              checked={option.checked}
              onChange={option.onSelect}
            />
            <span>
              <label htmlFor={`${id}-${i}`}>{option.label}</label>
              {option.years && (
                <>
                  {" "}
                  <YearsInput
                    label={option.years.label}
                    value={option.years.value}
                    onChange={option.years.onChange}
                    onFocus={option.onSelect}
                  />{" "}
                  {yearsUnit(option.years.value)}
                  {option.years.after}
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function NdaForm({ data, onChange, onPartyChange }: NdaFormProps) {
  return (
    <form className="nda-form" onSubmit={(e) => e.preventDefault()}>
      <Fieldset legend="The agreement">
        <Field label="Purpose" hint="How confidential information may be used">
          <textarea
            rows={3}
            value={data.purpose}
            onChange={(e) => onChange("purpose", e.target.value)}
          />
        </Field>
        <Field label="Effective date">
          <input
            type="date"
            value={data.effectiveDate}
            onChange={(e) => onChange("effectiveDate", e.target.value)}
          />
        </Field>
      </Fieldset>

      <Fieldset legend="How long it lasts">
        <TermChoice
          legend="MNDA term"
          name="mndaTerm"
          options={[
            {
              label: "Expires after",
              checked: data.mndaTerm === "expires",
              onSelect: () => onChange("mndaTerm", "expires"),
              years: {
                label: "MNDA term in years",
                value: data.mndaTermYears,
                onChange: (years) => onChange("mndaTermYears", years),
              },
            },
            {
              label: "Continues until terminated",
              checked: data.mndaTerm === "untilTerminated",
              onSelect: () => onChange("mndaTerm", "untilTerminated"),
            },
          ]}
        />
        <TermChoice
          legend="Confidentiality"
          hint="How long confidential information stays protected"
          name="confidentialityTerm"
          options={[
            {
              label: "For",
              checked: data.confidentialityTerm === "years",
              onSelect: () => onChange("confidentialityTerm", "years"),
              years: {
                label: "Confidentiality term in years",
                value: data.confidentialityYears,
                onChange: (years) => onChange("confidentialityYears", years),
                after: ", trade secrets for as long as they remain secret",
              },
            },
            {
              label: "In perpetuity",
              checked: data.confidentialityTerm === "perpetual",
              onSelect: () => onChange("confidentialityTerm", "perpetual"),
            },
          ]}
        />
      </Fieldset>

      <Fieldset legend="Governing law">
        <Field label="State">
          <input
            type="text"
            placeholder="Delaware"
            value={data.governingLaw}
            onChange={(e) => onChange("governingLaw", e.target.value)}
          />
        </Field>
        <Field label="Jurisdiction" hint="City or county and state">
          <input
            type="text"
            placeholder="Courts located in New Castle, DE"
            value={data.jurisdiction}
            onChange={(e) => onChange("jurisdiction", e.target.value)}
          />
        </Field>
        <Field label="Modifications" hint="Optional changes to the standard terms">
          <textarea
            rows={2}
            value={data.modifications}
            onChange={(e) => onChange("modifications", e.target.value)}
          />
        </Field>
      </Fieldset>

      {([0, 1] as const).map((index) => {
        const party = data.parties[index];
        return (
          <Fieldset key={index} legend={`Party ${index + 1}`}>
            <Field label="Company">
              <input
                type="text"
                autoComplete="organization"
                value={party.company}
                onChange={(e) => onPartyChange(index, "company", e.target.value)}
              />
            </Field>
            <div className="field-row">
              <Field label="Signer’s name">
                <input
                  type="text"
                  autoComplete="name"
                  value={party.name}
                  onChange={(e) => onPartyChange(index, "name", e.target.value)}
                />
              </Field>
              <Field label="Title">
                <input
                  type="text"
                  autoComplete="organization-title"
                  value={party.title}
                  onChange={(e) => onPartyChange(index, "title", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Notice address" hint="Email or postal address">
              <input
                type="text"
                value={party.noticeAddress}
                onChange={(e) =>
                  onPartyChange(index, "noticeAddress", e.target.value)
                }
              />
            </Field>
          </Fieldset>
        );
      })}
    </form>
  );
}
