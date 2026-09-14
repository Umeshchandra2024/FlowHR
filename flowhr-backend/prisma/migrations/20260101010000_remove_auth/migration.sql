-- DropForeignKey
ALTER TABLE "workflows" DROP CONSTRAINT "workflows_ownerId_fkey";

-- DropIndex
DROP INDEX "workflows_ownerId_idx";

-- AlterTable
ALTER TABLE "workflows" DROP COLUMN "ownerId";

-- DropTable
DROP TABLE "users";
