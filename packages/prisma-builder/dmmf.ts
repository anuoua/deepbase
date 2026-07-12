import { getDMMF } from "@prisma/get-dmmf";
import fs from "node:fs";

const schema = `
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "./generated"
}

model User {
  id              Int      @id @default(autoincrement())
  createdAt       DateTime @default(now())
  email           String   @unique
  name            String?
  age             Int?
  score           Float?
  bio             String   @db.VarChar(1000)
  role            Role     @default(USER)
  status          UserStatus @default(ACTIVE)
  tags            String[]
  favoriteNumbers Int[]
  metadata        Json?
  posts           Post[]
  profile         Profile?
  comments        Comment[]
}

model Post {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  published Boolean   @default(false)
  title     String    @db.VarChar(255)
  content   String?
  likes     Int       @default(0)
  author    User      @relation(fields: [authorId], references: [id])
  authorId  Int
  comments  Comment[]
  tags      String[]
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  avatar String?
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id])
}

model Comment {
  id       Int   @id @default(autoincrement())
  text     String
  postId   Int
  post     Post  @relation(fields: [postId], references: [id])
  authorId Int
  author   User  @relation(fields: [authorId], references: [id])
}

enum Role {
  USER
  ADMIN
  EDITOR
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}
`;

const providerMatch = schema.match(/provider\s*=\s*"(\w+)"/);
const provider = providerMatch ? providerMatch[1]! : "postgresql";

const res = getDMMF({
  datamodel: schema,
});

if ("datamodel" in res) {
  console.log(
    "Models:",
    res.datamodel.models.map((m: { name: string }) => m.name),
  );
  console.log(
    "Enums:",
    res.datamodel.enums.map((e: { name: string }) => e.name),
  );
  const output = { provider, ...res };
  fs.writeFileSync("./DMMF.json", JSON.stringify(output, undefined, 2));
  console.log("\nGenerated DMMF.json");
} else {
  console.error("Failed to generate DMMF:", res);
}
