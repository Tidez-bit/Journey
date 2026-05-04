/*
  Warnings:

  - You are about to drop the column `pdArea` on the `scanner` table. All the data in the column will be lost.
  - You are about to drop the column `trend15M` on the `scanner` table. All the data in the column will be lost.
  - You are about to drop the column `trend1H` on the `scanner` table. All the data in the column will be lost.
  - You are about to drop the column `trend4H` on the `scanner` table. All the data in the column will be lost.
  - You are about to drop the column `trendD1` on the `scanner` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `trade` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `trade` table. All the data in the column will be lost.
  - You are about to drop the column `stopLoss` on the `trade` table. All the data in the column will be lost.
  - You are about to drop the column `takeProfit` on the `trade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,date]` on the table `DailyTargetLog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,date,pair,timeframe]` on the table `Scanner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tradeId,ruleId]` on the table `TradeRule` will be added. If there are existing duplicate values, this will fail.
  - Made the column `actualPnl` on table `dailytargetlog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Rule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentPrice` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastHigh` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastLow` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pdArray` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pdPercent` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeframe` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trend` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Scanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Target` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openTime` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Made the column `pnl` on table `trade` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `dailytargetlog` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `actualPnl` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `rule` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `scanner` DROP COLUMN `pdArea`,
    DROP COLUMN `trend15M`,
    DROP COLUMN `trend1H`,
    DROP COLUMN `trend4H`,
    DROP COLUMN `trendD1`,
    ADD COLUMN `confidence` INTEGER NULL,
    ADD COLUMN `currentPrice` DOUBLE NOT NULL,
    ADD COLUMN `lastHigh` DOUBLE NOT NULL,
    ADD COLUMN `lastLow` DOUBLE NOT NULL,
    ADD COLUMN `liquidityAbove` DOUBLE NULL,
    ADD COLUMN `liquidityBelow` DOUBLE NULL,
    ADD COLUMN `liquiditySide` VARCHAR(191) NULL,
    ADD COLUMN `obBearish` VARCHAR(191) NULL,
    ADD COLUMN `obBullish` VARCHAR(191) NULL,
    ADD COLUMN `obSide` VARCHAR(191) NULL,
    ADD COLUMN `pdArray` VARCHAR(191) NOT NULL,
    ADD COLUMN `pdPercent` DOUBLE NOT NULL,
    ADD COLUMN `structure` VARCHAR(191) NULL,
    ADD COLUMN `timeframe` VARCHAR(191) NOT NULL,
    ADD COLUMN `trend` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `volumeRatio` DOUBLE NULL;

-- AlterTable
ALTER TABLE `target` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `trade` DROP COLUMN `date`,
    DROP COLUMN `size`,
    DROP COLUMN `stopLoss`,
    DROP COLUMN `takeProfit`,
    ADD COLUMN `exitPrice` DOUBLE NULL,
    ADD COLUMN `exitTime` DATETIME(3) NULL,
    ADD COLUMN `openTime` DATETIME(3) NOT NULL,
    ADD COLUMN `slPrice` DOUBLE NULL,
    ADD COLUMN `strategy` VARCHAR(191) NULL,
    ADD COLUMN `tpPrice` DOUBLE NULL,
    MODIFY `pnl` DOUBLE NOT NULL,
    MODIFY `notes` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `traderule` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user` ADD COLUMN `maxLossResetDate` DATETIME(3) NULL,
    ADD COLUMN `maxLossType` VARCHAR(191) NOT NULL DEFAULT 'FIXED',
    ADD COLUMN `maxLossValue` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `scannerEnabled` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX `DailyTargetLog_userId_date_key` ON `DailyTargetLog`(`userId`, `date`);

-- CreateIndex
CREATE INDEX `Scanner_userId_date_idx` ON `Scanner`(`userId`, `date`);

-- CreateIndex
CREATE INDEX `Scanner_userId_pair_timeframe_idx` ON `Scanner`(`userId`, `pair`, `timeframe`);

-- CreateIndex
CREATE UNIQUE INDEX `Scanner_userId_date_pair_timeframe_key` ON `Scanner`(`userId`, `date`, `pair`, `timeframe`);

-- CreateIndex
CREATE INDEX `Trade_userId_openTime_idx` ON `Trade`(`userId`, `openTime`);

-- CreateIndex
CREATE INDEX `Trade_userId_pair_idx` ON `Trade`(`userId`, `pair`);

-- CreateIndex
CREATE UNIQUE INDEX `TradeRule_tradeId_ruleId_key` ON `TradeRule`(`tradeId`, `ruleId`);

