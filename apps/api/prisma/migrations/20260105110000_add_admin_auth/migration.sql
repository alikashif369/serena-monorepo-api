-- CreateTable (must be created BEFORE altering the enum)
CREATE TABLE "auth"."admin_invitations" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "auth"."UserRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "invitedBy" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitations_email_key" ON "auth"."admin_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitations_token_key" ON "auth"."admin_invitations"("token");

-- AddForeignKey
ALTER TABLE "auth"."admin_invitations" ADD CONSTRAINT "admin_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum (now that admin_invitations exists, we can safely alter the enum)
BEGIN;
CREATE TYPE "auth"."UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN');
ALTER TABLE "auth"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "auth"."users" ALTER COLUMN "role" TYPE "auth"."UserRole_new" USING ("role"::text::"auth"."UserRole_new");
ALTER TABLE "auth"."admin_invitations" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "auth"."admin_invitations" ALTER COLUMN "role" TYPE "auth"."UserRole_new" USING ("role"::text::"auth"."UserRole_new");
ALTER TYPE "auth"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "auth"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "auth"."UserRole_old";
ALTER TABLE "auth"."users" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
ALTER TABLE "auth"."admin_invitations" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
COMMIT;
