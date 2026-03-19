"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type JsonSchema = {
  type?: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  [key: string]: unknown;
};

export interface SchemaFormProps {
  schema: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  isLoading: boolean;
  disabled?: boolean;
  initialValues?: Record<string, unknown>;
  onRegisterSubmit?: (fn: () => void) => void;
}

// ── Schema normalization ──────────────────────────────────────────────────────

function normalize(raw: JsonSchema): JsonSchema {
  // anyOf/oneOf with null → unwrap to the non-null variant
  const variants = raw.anyOf ?? raw.oneOf;
  if (variants?.length) {
    const nonNull = variants.find((v) => v.type !== "null");
    if (nonNull) return normalize({ ...nonNull, description: raw.description ?? nonNull.description });
  }
  // ["string", "null"] → "string"
  if (Array.isArray(raw.type)) {
    const nonNull = raw.type.find((t) => t !== "null");
    return { ...raw, type: nonNull ?? "string" };
  }
  return raw;
}

function getType(schema: JsonSchema): string {
  const s = normalize(schema);
  if (s.enum) return "enum";
  return (s.type as string) ?? "string";
}

// ── Default value initializer ─────────────────────────────────────────────────

function initValue(schema: JsonSchema): unknown {
  const s = normalize(schema);
  if (s.default !== undefined) return s.default;
  const type = getType(s);
  switch (type) {
    case "object": {
      const obj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(s.properties ?? {})) {
        obj[k] = initValue(v);
      }
      return obj;
    }
    case "array": {
      const min = s.minItems ?? 1;
      return Array.from({ length: min }, () => (s.items ? initValue(s.items) : ""));
    }
    case "boolean":
      return false;
    case "number":
    case "integer":
      return "";
    case "enum":
      return s.enum?.[0] ?? "";
    default:
      return "";
  }
}

function initFromTopSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const s = schema as JsonSchema;
  const values: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s.properties ?? {})) {
    values[k] = initValue(v as JsonSchema);
  }
  return values;
}

// ── Type coercion before submit ───────────────────────────────────────────────

function coerce(schema: JsonSchema, value: unknown): unknown {
  const s = normalize(schema);
  const type = getType(s);

  if (type === "object") {
    const obj = (value as Record<string, unknown>) ?? {};
    const result: Record<string, unknown> = {};
    const required = s.required ?? [];
    for (const [k, prop] of Object.entries(s.properties ?? {})) {
      const v = obj[k];
      const coerced = coerce(prop as JsonSchema, v);
      // Omit empty optional fields
      if (!required.includes(k) && (coerced === "" || coerced === undefined || coerced === null)) {
        continue;
      }
      result[k] = coerced;
    }
    return result;
  }

  if (type === "array") {
    const arr = (value as unknown[]) ?? [];
    return arr.map((item) => (s.items ? coerce(s.items, item) : item)).filter((v) => v !== "" && v !== undefined);
  }

  if (type === "number" || type === "integer") {
    if (value === "" || value === undefined || value === null) return undefined;
    const n = Number(value);
    return isNaN(n) ? undefined : n;
  }

  if (type === "boolean") return Boolean(value);

  return value;
}

// ── Styling helpers ───────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  string: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  number: "bg-green-500/10 text-green-400 border-green-500/20",
  integer: "bg-green-500/10 text-green-400 border-green-500/20",
  boolean: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  object: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  array: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  enum: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border ${TYPE_BADGE[type] ?? "bg-muted text-muted-foreground border-border"}`}>
      {type}
    </span>
  );
}

function fieldLabel(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const INPUT_BASE =
  "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 transition-colors";

// ── Individual field renderers ────────────────────────────────────────────────

function StringField({
  name,
  schema,
  value,
  onChange,
  disabled,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const isTextarea =
    /multiline/i.test(schema.description ?? "") ||
    /body|content|text|query|prompt|code/i.test(name);

  const placeholder = schema.default !== undefined ? String(schema.default) : "";

  if (isTextarea) {
    return (
      <textarea
        rows={3}
        className={`${INPUT_BASE} resize-y`}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }
  return (
    <input
      type="text"
      className={INPUT_BASE}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function NumberField({
  schema,
  value,
  onChange,
  disabled,
}: {
  schema: JsonSchema;
  value: unknown;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const type = getType(schema);
  return (
    <input
      type="number"
      step={type === "integer" ? "1" : "any"}
      min={schema.minimum}
      max={schema.maximum}
      className={INPUT_BASE}
      value={(value as string | number) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={schema.default !== undefined ? String(schema.default) : ""}
      disabled={disabled}
    />
  );
}

function BooleanField({
  value,
  onChange,
  disabled,
}: {
  value: unknown;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const checked = Boolean(value);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-primary bg-primary" : "border-border bg-muted"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-background shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function EnumField({
  schema,
  value,
  onChange,
  disabled,
}: {
  schema: JsonSchema;
  value: unknown;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const options = (schema.enum ?? []).map(String);

  // Radio group for ≤3 options
  if (options.length <= 3) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              name={`enum-${options.join("-")}`}
              value={opt}
              checked={(value as string) === opt}
              onChange={() => onChange(opt)}
              disabled={disabled}
              className="accent-primary"
            />
            <span className="text-sm font-mono text-foreground">{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <select
      className={INPUT_BASE}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function ArrayField({
  name,
  schema,
  value,
  onChange,
  disabled,
  depth,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (v: unknown[]) => void;
  disabled?: boolean;
  depth: number;
}) {
  const arr = Array.isArray(value) ? value : [];
  const itemSchema = schema.items as JsonSchema | undefined;
  const maxItems = schema.maxItems ?? Infinity;

  const addItem = () => {
    if (arr.length >= maxItems) return;
    onChange([...arr, itemSchema ? initValue(itemSchema) : ""]);
  };

  const removeItem = (i: number) => {
    const min = schema.minItems ?? 0;
    if (arr.length <= min) return;
    onChange(arr.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, v: unknown) => {
    const next = [...arr];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {arr.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            {itemSchema && getType(itemSchema) === "object" ? (
              <ObjectField
                name={`${name}[${i}]`}
                schema={itemSchema}
                value={item as Record<string, unknown>}
                onChange={(v) => updateItem(i, v)}
                disabled={disabled}
                depth={depth + 1}
              />
            ) : (
              <input
                type={itemSchema && (getType(itemSchema) === "number" || getType(itemSchema) === "integer") ? "number" : "text"}
                className={INPUT_BASE}
                value={String(item ?? "")}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder={`Item ${i + 1}`}
                disabled={disabled}
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => removeItem(i)}
            disabled={disabled || arr.length <= (schema.minItems ?? 0)}
            className="mt-1.5 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        disabled={disabled || arr.length >= maxItems}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add item
        {maxItems !== Infinity && ` (max ${maxItems})`}
      </button>
    </div>
  );
}

function ObjectField({
  name,
  schema,
  value,
  onChange,
  disabled,
  depth,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (v: Record<string, unknown>) => void;
  disabled?: boolean;
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  const obj = (value as Record<string, unknown>) ?? {};
  const properties = schema.properties ?? {};
  const required = schema.required ?? [];

  const updateProp = (key: string, v: unknown) => {
    onChange({ ...obj, [key]: v });
  };

  return (
    <div className={`rounded-md border border-border/50 overflow-hidden ${depth > 0 ? "border-l-2 border-l-purple-500/30" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <span className="text-xs font-medium text-muted-foreground">{fieldLabel(name)}</span>
        {schema.description && (
          <span className="text-xs text-muted-foreground/60 truncate">{schema.description}</span>
        )}
      </button>
      {open && (
        <div className="px-3 py-3 space-y-4">
          <FieldList
            properties={properties}
            required={required}
            values={obj}
            onUpdate={updateProp}
            disabled={disabled}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
}

// ── Field row (label + input) ─────────────────────────────────────────────────

function FieldRow({
  name,
  schema: rawSchema,
  value,
  onChange,
  required,
  disabled,
  depth,
  error,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  required: boolean;
  disabled?: boolean;
  depth: number;
  error?: string;
}) {
  const schema = normalize(rawSchema);
  const type = getType(schema);

  const renderInput = () => {
    switch (type) {
      case "object":
        return (
          <ObjectField
            name={name}
            schema={schema}
            value={value}
            onChange={(v) => onChange(v)}
            disabled={disabled}
            depth={depth}
          />
        );
      case "array":
        return (
          <ArrayField
            name={name}
            schema={schema}
            value={value}
            onChange={(v) => onChange(v)}
            disabled={disabled}
            depth={depth}
          />
        );
      case "boolean":
        return <BooleanField value={value} onChange={(v) => onChange(v)} disabled={disabled} />;
      case "enum":
        return <EnumField schema={schema} value={value} onChange={(v) => onChange(v)} disabled={disabled} />;
      case "number":
      case "integer":
        return <NumberField schema={schema} value={value} onChange={(v) => onChange(v)} disabled={disabled} />;
      default:
        return <StringField name={name} schema={schema} value={value} onChange={(v) => onChange(v)} disabled={disabled} />;
    }
  };

  // Object and array fields render their own full-width container
  const isFullWidth = type === "object" || type === "array";

  if (isFullWidth) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {fieldLabel(name)}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </span>
          <TypeBadge type={type} />
        </div>
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
        {renderInput()}
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[180px_1fr] items-start gap-4 sm:grid-cols-[200px_1fr]">
        <div className="pt-2 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {fieldLabel(name)}
              {required && <span className="text-red-400 ml-0.5">*</span>}
            </span>
            <TypeBadge type={type} />
          </div>
          {schema.description && (
            <p className="text-xs text-muted-foreground/70 leading-relaxed">{schema.description}</p>
          )}
        </div>
        <div className={`${type === "boolean" ? "pt-2" : ""} ${error ? "rounded-md ring-1 ring-red-500/40" : ""}`}>
          {renderInput()}
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

// ── Field list (sorts required first, then optional) ──────────────────────────

function FieldList({
  properties,
  required,
  values,
  onUpdate,
  disabled,
  depth,
  errors = {},
}: {
  properties: Record<string, JsonSchema>;
  required: string[];
  values: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
  depth: number;
  errors?: Record<string, string>;
}) {
  const entries = Object.entries(properties);
  const reqEntries = entries.filter(([k]) => required.includes(k));
  const optEntries = entries.filter(([k]) => !required.includes(k));

  return (
    <div className="space-y-4">
      {reqEntries.map(([k, s]) => (
        <FieldRow
          key={k}
          name={k}
          schema={s}
          value={values[k]}
          onChange={(v) => onUpdate(k, v)}
          required
          disabled={disabled}
          depth={depth}
          error={errors[k]}
        />
      ))}

      {optEntries.length > 0 && reqEntries.length > 0 && (
        <div className="flex items-center gap-2 py-1">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Optional</span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      )}

      {optEntries.map(([k, s]) => (
        <FieldRow
          key={k}
          name={k}
          schema={s}
          value={values[k]}
          onChange={(v) => onUpdate(k, v)}
          required={false}
          disabled={disabled}
          depth={depth}
        />
      ))}
    </div>
  );
}

// ── Main SchemaForm component ─────────────────────────────────────────────────

export function SchemaForm({
  schema,
  onSubmit,
  isLoading,
  disabled,
  initialValues,
  onRegisterSubmit,
}: SchemaFormProps) {
  const s = schema as JsonSchema;
  const properties = s.properties ?? {};
  const required = s.required ?? [];
  const hasFields = Object.keys(properties).length > 0;

  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initialValues ?? initFromTopSchema(schema),
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Re-initialize when schema or initialValues change
  useEffect(() => {
    setValues(initialValues ?? initFromTopSchema(schema));
  }, [schema, initialValues]);

  // Register the submit trigger with the parent
  useEffect(() => {
    onRegisterSubmit?.(() => formRef.current?.requestSubmit());
  }, [onRegisterSubmit]);

  const updateField = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear the error for this field as soon as the user edits it
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields before submitting
    const errs: Record<string, string> = {};
    for (const key of required) {
      const s = normalize((properties[key] ?? {}) as JsonSchema);
      const type = getType(s);
      // Booleans, enums, objects, arrays always have a valid initial state
      if (type === "boolean" || type === "enum" || type === "object" || type === "array") continue;
      const val = values[key];
      if (type === "number" || type === "integer") {
        if (val === "" || val === undefined || val === null) errs[key] = "This field is required";
        continue;
      }
      if (!val || (typeof val === "string" && val.trim() === "")) {
        errs[key] = "This field is required";
      }
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});

    // Coerce all values using the schema
    const coerced: Record<string, unknown> = {};
    for (const [k, prop] of Object.entries(properties)) {
      coerced[k] = coerce(prop as JsonSchema, values[k]);
    }

    // Remove undefined values
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(coerced)) {
      if (v !== undefined) clean[k] = v;
    }

    onSubmit(clean);
  };

  if (!hasFields) {
    return (
      <form ref={formRef} onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground italic py-4">
          This tool takes no parameters.
        </p>
      </form>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <FieldList
        properties={properties}
        required={required}
        values={values}
        onUpdate={updateField}
        disabled={disabled || isLoading}
        depth={0}
        errors={formErrors}
      />
    </form>
  );
}
