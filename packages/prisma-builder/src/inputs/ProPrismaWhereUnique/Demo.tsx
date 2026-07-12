import { useMemo, useState } from "react";
import { ProPrismaWhereUnique } from "./ProPrismaWhereUnique";
import {
  toPrismaWhereUnique,
  type WhereUniqueValue,
} from "./types";
import {
  dmmfToUniqueFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import { mergePlaceholders } from "../ProPrismaPlaceholder/utils";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userUniqueFields = dmmfToUniqueFields(dmmf, "User");
const SAMPLE_EXTERNAL: Record<string, unknown> = {
  id: 42,
  email: "alice@example.com",
};

export const ProPrismaWhereUniqueDemo = () => {
  const [whereUnique, setWhereUnique] = useState<WhereUniqueValue>({
    field: "id",
    value: 1,
  });

  const rawOutput = useMemo(
    () => toPrismaWhereUnique(whereUnique, userUniqueFields),
    [whereUnique],
  );
  const mergedOutput = useMemo(
    () => mergePlaceholders(rawOutput, SAMPLE_EXTERNAL),
    [rawOutput],
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Where Unique Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a unique identifier for <code>findUnique</code>,{" "}
        <code>update</code>, <code>delete</code>, and <code>upsert</code>{" "}
        (selects from <code>@id</code> and <code>@unique</code> fields). Use the{" "}
        <code>P</code> toggle to mark a value as a placeholder — it renders as{" "}
        <code>"__USERINPUT__"</code> in the output and gets replaced via{" "}
        <code>mergePlaceholders</code>.
      </p>
      <ProPrismaWhereUnique
        fields={userUniqueFields}
        value={whereUnique}
        onChange={setWhereUnique}
      />

      <div style={{ marginTop: 16, padding: 12, background: "#fffbe6", borderRadius: 6, border: "1px solid #ffe58f" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#ad8b00" }}>
          Merged Output (with external data)
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(mergedOutput, null, 2)}
        </pre>
      </div>
    </div>
  );
};
