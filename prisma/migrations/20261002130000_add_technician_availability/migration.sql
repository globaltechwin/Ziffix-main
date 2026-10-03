CREATE TABLE `technicianavailability` (
  `id` VARCHAR(191) NOT NULL,
  `technicianId` VARCHAR(191) NOT NULL,
  `dayOfWeek` INTEGER NOT NULL,
  `isAvailable` BOOLEAN NOT NULL DEFAULT true,
  `startTime` VARCHAR(191) NULL,
  `endTime` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `TechnicianAvailability_technicianId_dayOfWeek_key`(`technicianId`, `dayOfWeek`),
  INDEX `TechnicianAvailability_technicianId_idx`(`technicianId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `TechnicianAvailability_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
