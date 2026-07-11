import { Tabs } from "antd";
import { ProPrismaWhereDemo } from "./ProPrismaWhere/Demo";
import { ProPrismaSelectDemo } from "./ProPrismaSelect/Demo";
import { ProPrismaOrderByDemo } from "./ProPrismaOrderBy/Demo";
import { ProPrismaCreateDataDemo } from "./ProPrismaCreateData/Demo";
import { ProPrismaUpdateDataDemo } from "./ProPrismaUpdateData/Demo";
import { ProPrismaPaginationDemo } from "./ProPrismaPagination/Demo";
import { ProPrismaWhereUniqueDemo } from "./ProPrismaWhereUnique/Demo";

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
          {
            key: "pagination",
            label: "Prisma Pagination Builder",
            children: <ProPrismaPaginationDemo />,
          },
          {
            key: "whereUnique",
            label: "Prisma Where Unique Builder",
            children: <ProPrismaWhereUniqueDemo />,
          },
        ]}
      />
    </div>
  );
};
