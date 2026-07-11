import { Layout, Menu } from "antd";
import React, { useState } from "react";
import { ProPrismaWhereDemo } from "./ProPrismaWhere/Demo";
import { ProPrismaSelectDemo } from "./ProPrismaSelect/Demo";
import { ProPrismaOrderByDemo } from "./ProPrismaOrderBy/Demo";
import { ProPrismaCreateDataDemo } from "./ProPrismaCreateData/Demo";
import { ProPrismaCreateDemo } from "./ProPrismaCreate/Demo";
import { ProPrismaUpdateDataDemo } from "./ProPrismaUpdateData/Demo";
import { ProPrismaIncludeDemo } from "./ProPrismaInclude/Demo";
import { ProPrismaPaginationDemo } from "./ProPrismaPagination/Demo";
import { ProPrismaWhereUniqueDemo } from "./ProPrismaWhereUnique/Demo";
import { ProPrismaUpsertDemo } from "./ProPrismaUpsert/Demo";
import { ProPrismaOmitDemo } from "./ProPrismaOmit/Demo";
import { ProPrismaDistinctDemo } from "./ProPrismaDistinct/Demo";
import { ProPrismaAggregateDemo } from "./ProPrismaAggregate/Demo";
import { ProPrismaGroupByDemo } from "./ProPrismaGroupBy/Demo";
import { ProPrismaFindFormDemo } from "./ProPrismaFindForm/Demo";
import { ProPrismaMutationFormDemo } from "./ProPrismaMutationForm/Demo";
import { ProPrismaBatchFormDemo } from "./ProPrismaBatchForm/Demo";
import { ProPrismaCountFormDemo } from "./ProPrismaCountForm/Demo";
import { ProPrismaAggregateFormDemo } from "./ProPrismaAggregateForm/Demo";
import { ProPrismaGroupByFormDemo } from "./ProPrismaGroupByForm/Demo";
import { ProPrismaRawFormDemo } from "./ProPrismaRawForm/Demo";
import { ProPrismaBatchDataDemo } from "./ProPrismaBatchData/Demo";

const { Sider, Content } = Layout;

const demos: Record<string, () => React.JSX.Element> = {
  findForm: () => <ProPrismaFindFormDemo />,
  create: () => <ProPrismaCreateDemo />,
  mutation: () => <ProPrismaMutationFormDemo />,
  upsert: () => <ProPrismaUpsertDemo />,
  batch: () => <ProPrismaBatchFormDemo />,
  count: () => <ProPrismaCountFormDemo />,
  aggregateForm: () => <ProPrismaAggregateFormDemo />,
  groupByForm: () => <ProPrismaGroupByFormDemo />,
  raw: () => <ProPrismaRawFormDemo />,
  where: () => <ProPrismaWhereDemo />,
  whereUnique: () => <ProPrismaWhereUniqueDemo />,
  select: () => <ProPrismaSelectDemo />,
  include: () => <ProPrismaIncludeDemo />,
  omit: () => <ProPrismaOmitDemo />,
  orderBy: () => <ProPrismaOrderByDemo />,
  pagination: () => <ProPrismaPaginationDemo />,
  distinct: () => <ProPrismaDistinctDemo />,
  createData: () => <ProPrismaCreateDataDemo />,
  updateData: () => <ProPrismaUpdateDataDemo />,
  aggregate: () => <ProPrismaAggregateDemo />,
  groupBy: () => <ProPrismaGroupByDemo />,
  batchData: () => <ProPrismaBatchDataDemo />,
};

const menuItems = [
  {
    key: "methodGroup",
    label: "Prisma Methods",
    type: "group" as const,
    children: [
      { key: "findForm", label: "Find (unique / first / many)" },
      { key: "create", label: "create" },
      { key: "mutation", label: "update / delete" },
      { key: "upsert", label: "upsert" },
      { key: "batch", label: "Batch (createMany / updateMany / deleteMany)" },
      { key: "count", label: "count" },
      { key: "aggregateForm", label: "aggregate" },
      { key: "groupByForm", label: "groupBy" },
      { key: "raw", label: "Raw (findRaw / aggregateRaw)" },
    ],
  },
  { key: "divider", type: "divider" as const },
  {
    key: "subGroup",
    label: "Sub-Components",
    type: "group" as const,
    children: [
      { key: "where", label: "Where" },
      { key: "whereUnique", label: "Where Unique" },
      { key: "select", label: "Select" },
      { key: "include", label: "Include" },
      { key: "omit", label: "Omit" },
      { key: "orderBy", label: "OrderBy" },
      { key: "pagination", label: "Pagination" },
      { key: "distinct", label: "Distinct" },
      { key: "createData", label: "Create Data" },
      { key: "updateData", label: "Update Data" },
      { key: "aggregate", label: "Aggregate (fields)" },
      { key: "groupBy", label: "GroupBy (sub)" },
      { key: "batchData", label: "Batch Data" },
    ],
  },
];

export const App = () => {
  const [active, setActive] = useState("findForm");

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="light">
        <Menu
          mode="inline"
          selectedKeys={[active]}
          defaultOpenKeys={["methodGroup", "subGroup"]}
          items={menuItems}
          onClick={(e) => setActive(e.key)}
          style={{ height: "100%", borderRight: 0, overflow: "auto" }}
        />
      </Sider>
      <Content style={{ padding: "40px 24px", maxWidth: 1000, width: "100%", margin: "0 auto" }}>
        {demos[active]?.() ?? <div>Select a component</div>}
      </Content>
    </Layout>
  );
};
