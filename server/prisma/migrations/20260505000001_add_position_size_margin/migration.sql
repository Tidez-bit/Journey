-- AlterTable
ALTER TABLE `Trade` ADD COLUMN `positionSize` DOUBLE NULL AFTER `exitPrice`,
                     ADD COLUMN `margin` DOUBLE NULL AFTER `positionSize`;
