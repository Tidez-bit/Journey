-- AlterTable
ALTER TABLE `trade` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'CLOSED';

-- CreateTable
CREATE TABLE `partialclose` (
    `id` VARCHAR(191) NOT NULL,
    `tradeId` VARCHAR(191) NOT NULL,
    `closeTime` DATETIME(3) NOT NULL,
    `closePrice` DOUBLE NOT NULL,
    `closedSize` DOUBLE NOT NULL,
    `pnl` DOUBLE NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartialClose_tradeId_idx`(`tradeId`),
    INDEX `PartialClose_tradeId_closeTime_idx`(`tradeId`, `closeTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Trade_userId_status_idx` ON `trade`(`userId`, `status`);

-- AddForeignKey
ALTER TABLE `partialclose` ADD CONSTRAINT `PartialClose_tradeId_fkey` FOREIGN KEY (`tradeId`) REFERENCES `trade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
