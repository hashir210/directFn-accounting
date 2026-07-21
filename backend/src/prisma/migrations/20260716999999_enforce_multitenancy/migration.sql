-- DropForeignKey
ALTER TABLE `bankaccount` DROP FOREIGN KEY `BankAccount_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `customer` DROP FOREIGN KEY `Customer_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `expense` DROP FOREIGN KEY `Expense_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `invoice` DROP FOREIGN KEY `Invoice_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_organizationId_fkey`;

-- DropIndex
DROP INDEX `Customer_email_key` ON `customer`;

-- DropIndex
DROP INDEX `Invoice_invoiceNo_key` ON `invoice`;

-- DropIndex
DROP INDEX `Product_sku_key` ON `product`;

-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- AlterTable
ALTER TABLE `bankaccount` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `customer` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `expense` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `invoice` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `organizationId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Customer_organizationId_email_key` ON `Customer`(`organizationId`, `email`);

-- CreateIndex
CREATE UNIQUE INDEX `Invoice_organizationId_invoiceNo_key` ON `Invoice`(`organizationId`, `invoiceNo`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_organizationId_sku_key` ON `Product`(`organizationId`, `sku`);

-- CreateIndex
CREATE UNIQUE INDEX `User_organizationId_email_key` ON `User`(`organizationId`, `email`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BankAccount` ADD CONSTRAINT `BankAccount_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

