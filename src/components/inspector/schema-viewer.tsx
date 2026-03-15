"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

type JsonSchemaProperty = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
};

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  description?: string;
  [key: string]: unknown;
};

const TYPE_COLORS: Record<string, string> = {
  string: "text-blue-400",
  number: "text-green-400",
  integer: "text-green-400",
  boolean: "text-orange-400",
  object: "text-purple-400",
  array: "text-yellow-400",
  null: "text-muted-foreground",
};

function getTypeColor(type?: string | string[]): string {
  if (!type) return "text-muted-foreground";
  const t = Array.isArray(type) ? type[0] : type;
  return TYPE_COLORS[t ?? ""] ?? "text-muted-foreground";
}

function getTypeBadgeBg(type?: string | string[]): string {
  const t = Array.isArray(type) ? type[0] : type;
  const map: Record<string, string> = {
    string: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    number: "bg-green-500/10 text-green-400 border-green-500/20",
    integer: "bg-green-500/10 text-green-400 border-green-500/20",
    boolean: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    object: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    array: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  return map[t ?? ""] ?? "bg-muted text-muted-foreground border-border";
}

function TypeBadge({ type }: { type?: string | string[] }) {
  const label = Array.isArray(type) ? type.join(" | ") : (type ?? "any");
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${getTypeBadgeBg(type)}`}>
      {label}
    </span>
  );
}

interface PropertyRowProps {
  name: string;
  schema: JsonSchemaProperty;
  required: boolean;
  depth: number;
}

function PropertyRow({ name, schema, required, depth }: PropertyRowProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren =
    schema.type === "object" && schema.properties && Object.keys(schema.properties).length > 0;
  const isArray = schema.type === "array";
  const arrayItemsIsObject =
    isArray && schema.items?.type === "object" && schema.items?.properties;

  const canExpand = hasChildren || arrayItemsIsObject;

  return (
    <div className="font-mono text-sm">
      <div
        className={`flex items-start gap-2 py-1.5 rounded px-2 -mx-2 ${canExpand ? "cursor-pointer hover:bg-muted/30" : ""}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={canExpand ? () => setExpanded(!expanded) : undefined}
      >
        {/* Expand toggle */}
        <span className="mt-0.5 w-4 shrink-0 text-muted-foreground">
          {canExpand ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="h-3.5 w-3.5 block" />
          )}
        </span>

        {/* Property name */}
        <span className={`shrink-0 ${getTypeColor(schema.type)}`}>{name}</span>

        {/* Required marker */}
        {required && (
          <span className="text-red-400 text-xs mt-0.5 shrink-0">*</span>
        )}

        {/* Type badge */}
        <TypeBadge type={schema.type} />

        {/* Enum values */}
        {schema.enum && (
          <span className="text-muted-foreground text-xs truncate max-w-[200px]">
            {schema.enum.map((v) => JSON.stringify(v)).join(" | ")}
          </span>
        )}

        {/* Default */}
        {schema.default !== undefined && (
          <span className="text-muted-foreground/60 text-xs">
            = {JSON.stringify(schema.default)}
          </span>
        )}

        {/* Description */}
        {schema.description && (
          <span className="text-muted-foreground text-xs truncate flex-1">
            — {schema.description}
          </span>
        )}
      </div>

      {/* Nested object properties */}
      {canExpand && expanded && hasChildren && (
        <div>
          {Object.entries(schema.properties!).map(([childName, childSchema]) => (
            <PropertyRow
              key={childName}
              name={childName}
              schema={childSchema}
              required={(schema.required ?? []).includes(childName)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Array items (if object) */}
      {canExpand && expanded && arrayItemsIsObject && (
        <div>
          {Object.entries(schema.items!.properties!).map(([childName, childSchema]) => (
            <PropertyRow
              key={childName}
              name={childName}
              schema={childSchema}
              required={(schema.items!.required ?? []).includes(childName)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SchemaViewerProps {
  schema: JsonSchema;
}

export function SchemaViewer({ schema }: SchemaViewerProps) {
  const properties = schema.properties ?? {};
  const required = schema.required ?? [];

  if (Object.keys(properties).length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No input parameters</p>
    );
  }

  return (
    <div className="rounded-md border border-border/50 bg-muted/10 p-3">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Input Schema
        </span>
        <span className="text-xs text-muted-foreground">
          {Object.keys(properties).length} parameter{Object.keys(properties).length !== 1 ? "s" : ""}
        </span>
        {required.length > 0 && (
          <span className="text-xs text-muted-foreground/60">
            • <span className="text-red-400">*</span> required
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {Object.entries(properties).map(([name, propSchema]) => (
          <PropertyRow
            key={name}
            name={name}
            schema={propSchema}
            required={required.includes(name)}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
