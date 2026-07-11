import type { WhereUniqueValue, UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { CreateFieldConfig } from "../ProPrismaCreateData/types";

export interface UpsertValue {
  where: WhereUniqueValue;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

export interface UpsertFieldConfig {
  uniqueFields: UniqueFieldConfig[];
  createFields: CreateFieldConfig[];
  updateFields: CreateFieldConfig[];
}

export { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
export { toPrismaCreateData } from "../ProPrismaCreateData/types";
export { toPrismaUpdateData } from "../ProPrismaUpdateData/types";
