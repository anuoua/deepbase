import { Tabs } from "antd";
import { ProPrismaWhereDemo } from "./ProPrismaWhere/Demo";
import { ProPrismaSelectDemo } from "./ProPrismaSelect/Demo";
import { ProPrismaOrderByDemo } from "./ProPrismaOrderBy/Demo";
import { ProPrismaCreateDataDemo } from "./ProPrismaCreateData/Demo";
import { ProPrismaUpdateDataDemo } from "./ProPrismaUpdateData/Demo";

export const App = () => {
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 20px" }}>
      <Tabs
        items={[
          {
            key: "create",
            label: "Prisma Create Data Builder",
            children: <ProPrismaCreateDataDemo />,
          },
          {
            key: "update",
            label: "Prisma Update Data Builder",
            children: <ProPrismaUpdateDataDemo />,
          },
          {
            key: "where",
            label: "Prisma Where Builder",
            children: <ProPrismaWhereDemo />,
          },
          {
            key: "select",
            label: "Prisma Select Builder",
            children: <ProPrismaSelectDemo />,
          },
          {
            key: "orderBy",
            label: "Prisma OrderBy Builder",
            children: <ProPrismaOrderByDemo />,
          },
        ]}
      />
    </div>
  );
};
