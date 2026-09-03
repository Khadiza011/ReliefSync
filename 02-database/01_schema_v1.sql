-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 31, 2026 at 05:43 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `reliefsync`
--
CREATE DATABASE IF NOT EXISTS `reliefsync` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `reliefsync`;

-- --------------------------------------------------------

--
-- Table structure for table `facilities`
--

CREATE TABLE `facilities` (
  `facility_id` smallint(5) UNSIGNED NOT NULL,
  `facility_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`facility_id`, `facility_name`, `description`) VALUES
(1, 'Safe Drinking Water', NULL),
(2, 'Accessible Toilet', NULL),
(3, 'Medical Support', NULL),
(4, 'Electricity', NULL),
(5, 'Cooking Area', NULL),
(6, 'Women and Child Safe Space', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `families`
--

CREATE TABLE `families` (
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `family_code` varchar(20) NOT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `current_district` varchar(80) NOT NULL,
  `current_area` varchar(150) DEFAULT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` enum('NEEDS_SHELTER','SHELTERED','RELOCATED','CLOSED') NOT NULL DEFAULT 'NEEDS_SHELTER',
  `registered_by` bigint(20) UNSIGNED DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `family_members`
--

CREATE TABLE `family_members` (
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `age_years` tinyint(3) UNSIGNED DEFAULT NULL,
  `sex` enum('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') DEFAULT NULL,
  `is_head` tinyint(1) NOT NULL DEFAULT 0,
  `relationship_to_head` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `member_special_needs`
--

CREATE TABLE `member_special_needs` (
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `need_id` smallint(5) UNSIGNED NOT NULL,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'ADMIN'),
(5, 'DONOR'),
(3, 'RELIEF_MANAGER'),
(2, 'SHELTER_MANAGER'),
(4, 'VOLUNTEER');

-- --------------------------------------------------------

--
-- Table structure for table `shelters`
--

CREATE TABLE `shelters` (
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `shelter_code` varchar(20) NOT NULL,
  `shelter_name` varchar(120) NOT NULL,
  `shelter_type` enum('COLLECTIVE','TEMPORARY','TRANSITIONAL','OTHER') NOT NULL DEFAULT 'COLLECTIVE',
  `district` varchar(80) NOT NULL,
  `upazila` varchar(80) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `total_capacity` int(10) UNSIGNED NOT NULL,
  `usable_area_sqm` decimal(10,2) DEFAULT NULL,
  `operational_status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `shelter_admissions`
--

CREATE TABLE `shelter_admissions` (
  `admission_id` bigint(20) UNSIGNED NOT NULL,
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `admitted_member_count` int(10) UNSIGNED NOT NULL,
  `admitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `admitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `discharged_at` timestamp NULL DEFAULT NULL,
  `status` enum('ACTIVE','DISCHARGED','CANCELLED') NOT NULL DEFAULT 'ACTIVE'
) ;

-- --------------------------------------------------------

--
-- Table structure for table `shelter_facilities`
--

CREATE TABLE `shelter_facilities` (
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `facility_id` smallint(5) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `special_need_types`
--

CREATE TABLE `special_need_types` (
  `need_id` smallint(5) UNSIGNED NOT NULL,
  `need_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `special_need_types`
--

INSERT INTO `special_need_types` (`need_id`, `need_name`, `description`) VALUES
(1, 'Mobility Assistance', NULL),
(2, 'Disability Support', NULL),
(3, 'Pregnancy Support', NULL),
(4, 'Chronic Medical Support', NULL),
(5, 'Infant Care', NULL),
(6, 'Elderly Assistance', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_shelter_capacity`
-- (See below for the actual view)
--
CREATE TABLE `vw_shelter_capacity` (
`shelter_id` int(10) unsigned
,`shelter_code` varchar(20)
,`shelter_name` varchar(120)
,`district` varchar(80)
,`total_capacity` int(10) unsigned
,`current_occupancy` decimal(32,0)
,`available_capacity` decimal(33,0)
,`capacity_status` varchar(11)
);

-- --------------------------------------------------------

--
-- Structure for view `vw_shelter_capacity`
--
DROP TABLE IF EXISTS `vw_shelter_capacity`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_shelter_capacity`  AS SELECT `s`.`shelter_id` AS `shelter_id`, `s`.`shelter_code` AS `shelter_code`, `s`.`shelter_name` AS `shelter_name`, `s`.`district` AS `district`, `s`.`total_capacity` AS `total_capacity`, coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) AS `current_occupancy`, `s`.`total_capacity`- coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) AS `available_capacity`, CASE WHEN `s`.`operational_status` = 'CLOSED' THEN 'CLOSED' WHEN coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) >= `s`.`total_capacity` THEN 'FULL' WHEN coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) >= `s`.`total_capacity` * 0.80 THEN 'NEARLY_FULL' ELSE 'AVAILABLE' END AS `capacity_status` FROM (`shelters` `s` left join `shelter_admissions` `sa` on(`s`.`shelter_id` = `sa`.`shelter_id`)) GROUP BY `s`.`shelter_id`, `s`.`shelter_code`, `s`.`shelter_name`, `s`.`district`, `s`.`total_capacity`, `s`.`operational_status` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`facility_id`),
  ADD UNIQUE KEY `facility_name` (`facility_name`);

--
-- Indexes for table `families`
--
ALTER TABLE `families`
  ADD PRIMARY KEY (`family_id`),
  ADD UNIQUE KEY `family_code` (`family_code`),
  ADD KEY `fk_family_registered_by` (`registered_by`);

--
-- Indexes for table `family_members`
--
ALTER TABLE `family_members`
  ADD PRIMARY KEY (`member_id`),
  ADD KEY `fk_member_family` (`family_id`);

--
-- Indexes for table `member_special_needs`
--
ALTER TABLE `member_special_needs`
  ADD PRIMARY KEY (`member_id`,`need_id`),
  ADD KEY `fk_msn_need` (`need_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `shelters`
--
ALTER TABLE `shelters`
  ADD PRIMARY KEY (`shelter_id`),
  ADD UNIQUE KEY `shelter_code` (`shelter_code`),
  ADD KEY `fk_shelter_creator` (`created_by`);

--
-- Indexes for table `shelter_admissions`
--
ALTER TABLE `shelter_admissions`
  ADD PRIMARY KEY (`admission_id`),
  ADD KEY `fk_admission_family` (`family_id`),
  ADD KEY `fk_admission_shelter` (`shelter_id`),
  ADD KEY `fk_admission_user` (`admitted_by`);

--
-- Indexes for table `shelter_facilities`
--
ALTER TABLE `shelter_facilities`
  ADD PRIMARY KEY (`shelter_id`,`facility_id`),
  ADD KEY `fk_sf_facility` (`facility_id`);

--
-- Indexes for table `special_need_types`
--
ALTER TABLE `special_need_types`
  ADD PRIMARY KEY (`need_id`),
  ADD UNIQUE KEY `need_name` (`need_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `facilities`
--
ALTER TABLE `facilities`
  MODIFY `facility_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `families`
--
ALTER TABLE `families`
  MODIFY `family_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `family_members`
--
ALTER TABLE `family_members`
  MODIFY `member_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `shelters`
--
ALTER TABLE `shelters`
  MODIFY `shelter_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shelter_admissions`
--
ALTER TABLE `shelter_admissions`
  MODIFY `admission_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `special_need_types`
--
ALTER TABLE `special_need_types`
  MODIFY `need_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `families`
--
ALTER TABLE `families`
  ADD CONSTRAINT `fk_family_registered_by` FOREIGN KEY (`registered_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `family_members`
--
ALTER TABLE `family_members`
  ADD CONSTRAINT `fk_member_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`family_id`) ON DELETE CASCADE;

--
-- Constraints for table `member_special_needs`
--
ALTER TABLE `member_special_needs`
  ADD CONSTRAINT `fk_msn_member` FOREIGN KEY (`member_id`) REFERENCES `family_members` (`member_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_msn_need` FOREIGN KEY (`need_id`) REFERENCES `special_need_types` (`need_id`);

--
-- Constraints for table `shelters`
--
ALTER TABLE `shelters`
  ADD CONSTRAINT `fk_shelter_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `shelter_admissions`
--
ALTER TABLE `shelter_admissions`
  ADD CONSTRAINT `fk_admission_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`family_id`),
  ADD CONSTRAINT `fk_admission_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters` (`shelter_id`),
  ADD CONSTRAINT `fk_admission_user` FOREIGN KEY (`admitted_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `shelter_facilities`
--
ALTER TABLE `shelter_facilities`
  ADD CONSTRAINT `fk_sf_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sf_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters` (`shelter_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
