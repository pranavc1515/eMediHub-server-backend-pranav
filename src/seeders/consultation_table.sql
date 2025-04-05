-- Create consultation table
CREATE TABLE IF NOT EXISTS `Consultations` (
  `id` CHAR(36) NOT NULL,
  `patientId` CHAR(36) NOT NULL,
  `doctorId` INT NOT NULL,
  `scheduledDate` DATE NOT NULL,
  `startTime` TIME NOT NULL,
  `endTime` TIME NOT NULL,
  `status` ENUM('scheduled', 'in-progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  `consultationType` ENUM('video', 'in-person') DEFAULT 'video',
  `roomName` VARCHAR(255),
  `notes` TEXT,
  `cancelReason` VARCHAR(255),
  `cancelledBy` ENUM('patient', 'doctor'),
  `actualStartTime` DATETIME,
  `actualEndTime` DATETIME,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_patientId` (`patientId`),
  INDEX `idx_doctorId` (`doctorId`),
  INDEX `idx_scheduledDate` (`scheduledDate`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_consultation_patient` FOREIGN KEY (`patientId`) REFERENCES `Patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_doctor` FOREIGN KEY (`doctorId`) REFERENCES `doctor_personal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for finding upcoming consultations efficiently
CREATE INDEX IF NOT EXISTS `idx_upcoming_consultations` ON `Consultations` (`patientId`, `status`, `scheduledDate`, `startTime`);

-- Create index for finding queue consultations efficiently
CREATE INDEX IF NOT EXISTS `idx_queue_consultations` ON `Consultations` (`doctorId`, `status`, `scheduledDate`, `startTime`);

-- Create index for finding consultation history efficiently
CREATE INDEX IF NOT EXISTS `idx_consultation_history` ON `Consultations` (`patientId`, `status`, `updatedAt`);
CREATE INDEX IF NOT EXISTS `idx_doctor_consultation_history` ON `Consultations` (`doctorId`, `status`, `updatedAt`); 