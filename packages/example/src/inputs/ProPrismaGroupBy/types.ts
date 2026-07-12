import type {
  AggregateFieldConfig,
  AggregateValue,
} from "../ProPrismaAggregate/types";

export interface GroupByValue {
  by: string[];
  aggregate: AggregateValue;
}

export type GroupByFieldConfig = {
  scalarFields: { name: string; label: string }[];
  aggregateFields: AggregateFieldConfig[];
};

export { toPrismaAggregate } from "../ProPrismaAggregate/types";

export function emptyGroupByValue(): GroupByValue {
  return { by: [], aggregate: {} };
}
