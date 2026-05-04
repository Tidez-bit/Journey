-- DropForeignKey
ALTER TABLE `traderule` DROP FOREIGN KEY `TradeRule_ruleId_fkey`;

-- DropForeignKey
ALTER TABLE `traderule` DROP FOREIGN KEY `TradeRule_tradeId_fkey`;

-- CreateIndex
CREATE INDEX `Trade_userId_idx` ON `Trade`(`userId`);

-- CreateIndex
CREATE INDEX `TradeRule_tradeId_idx` ON `TradeRule`(`tradeId`);

-- AddForeignKey
ALTER TABLE `TradeRule` ADD CONSTRAINT `TradeRule_tradeId_fkey` FOREIGN KEY (`tradeId`) REFERENCES `Trade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TradeRule` ADD CONSTRAINT `TradeRule_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `Rule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `traderule` RENAME INDEX `TradeRule_ruleId_fkey` TO `TradeRule_ruleId_idx`;
