import { Tabs } from "antd";
import { ProPrismaWhereDemo } from "./ProPrismaWhere/Demo";
import { ProPrismaSelectDemo } from "./ProPrismaSelect/Demo";
import { ProPrismaOrderByDemo } from "./ProPrismaOrderBy/Demo";
import { ProPrismaCreateDataDemo } from "./ProPrismaCreateData/Demo";
import { ProPrismaUpdateDataDemo } from "./ProPrismaUpdateData/Demo";
import { ProPrismaIncludeDemo } from "./ProPrismaInclude/Demo";
import { ProPrismaPaginationDemo } from "./ProPrismaPagination/Demo";
import { ProPrismaWhereUniqueDemo } from "./ProPrismaWhereUnique/Demo";
import { ProPrismaUpsertDemo } from "./ProPrismaUpsert/Demo";
import { ProPrismaOmitDemo } from "./ProPrismaOmit/Demo";
import { ProPrismaDistinctDemo } from "./ProPrismaDistinct/Demo";
import { ProPrismaAggregateDemo } from "./ProPrismaAggregate/Demo";
import { ProPrismaGroupByDemo } from "./ProPrismaGroupBy/Demo";

export const App = () => {
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 20px" }}>
      <Tabs
        items={[
          { key: "create", label: "Create Data", children: <ProPrismaCreateDataDemo /> },
          { key: "update", label: "Update Data", children: <ProPrismaUpdateDataDemo /> },
          { key: "upsert", label: "Upsert", children: <ProPrismaUpsertDemo /> },
          { key: "where", label: "Where", children: <ProPrismaWhereDemo /> },
          { key: "whereUnique", label: "Where Unique", children: <ProPrismaWhereUniqueDemo /> },
          { key: "select", label: "Select", children: <ProPrismaSelectDemo /> },
          { key: "include", label: "Include", children: <ProPrismaIncludeDemo /> },
          { key: "omit", label: "Omit", children: <ProPrismaOmitDemo /> },
          { key: "orderBy", label: "OrderBy", children: <ProPrismaOrderByDemo /> },
          { key: "pagination", label: "Pagination", children: <ProPrismaPaginationDemo /> },
          { key: "distinct", label: "Distinct", children: <ProPrismaDistinctDemo /> },
          { key: "aggregate", label: "Aggregate", children: <ProPrismaAggregateDemo /> },
          { key: "groupBy", label: "GroupBy", children: <ProPrismaGroupByDemo /> },
        ]}
      />
    </div>
  );
};
