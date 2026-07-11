import { Layout, Menu } from "antd";
import { useState } from "react";
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

const { Sider, Content } = Layout;

const items = [
  { key: "create", label: "create()", render: () => <ProPrismaCreateDemo /> },
  { key: "createData", label: "Create Data", render: () => <ProPrismaCreateDataDemo /> },
  { key: "update", label: "Update Data", render: () => <ProPrismaUpdateDataDemo /> },
  { key: "upsert", label: "Upsert", render: () => <ProPrismaUpsertDemo /> },
  { key: "where", label: "Where", render: () => <ProPrismaWhereDemo /> },
  { key: "whereUnique", label: "Where Unique", render: () => <ProPrismaWhereUniqueDemo /> },
  { key: "select", label: "Select", render: () => <ProPrismaSelectDemo /> },
  { key: "include", label: "Include", render: () => <ProPrismaIncludeDemo /> },
  { key: "omit", label: "Omit", render: () => <ProPrismaOmitDemo /> },
  { key: "orderBy", label: "OrderBy", render: () => <ProPrismaOrderByDemo /> },
  { key: "pagination", label: "Pagination", render: () => <ProPrismaPaginationDemo /> },
  { key: "distinct", label: "Distinct", render: () => <ProPrismaDistinctDemo /> },
  { key: "aggregate", label: "Aggregate", render: () => <ProPrismaAggregateDemo /> },
  { key: "groupBy", label: "GroupBy", render: () => <ProPrismaGroupByDemo /> },
];

export const App = () => {
  const [active, setActive] = useState(items[0]!.key);
  const current = items.find((i) => i.key === active)!;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} theme="light">
        <Menu
          mode="inline"
          selectedKeys={[active]}
          items={items.map(({ key, label }) => ({ key, label }))}
          onClick={(e) => setActive(e.key as string)}
          style={{ height: "100%", borderRight: 0 }}
        />
      </Sider>
      <Content style={{ padding: "40px 24px", maxWidth: 1000, width: "100%", margin: "0 auto" }}>
        {current.render()}
      </Content>
    </Layout>
  );
};
