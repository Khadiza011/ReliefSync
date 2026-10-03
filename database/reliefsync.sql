-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 19, 2026 at 07:20 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- ReliefSync: creates the database if needed and selects it,
-- so this file can be imported directly in phpMyAdmin or the mysql CLI.
CREATE DATABASE IF NOT EXISTS `reliefsync` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `reliefsync`;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `reliefsync`
--

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `assignment_id` bigint(20) UNSIGNED NOT NULL,
  `volunteer_id` bigint(20) UNSIGNED NOT NULL,
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `skill_id` smallint(5) UNSIGNED DEFAULT NULL,
  `task_title` varchar(150) NOT NULL,
  `task_description` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `assigned_by` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`assignment_id`, `volunteer_id`, `shelter_id`, `skill_id`, `task_title`, `task_description`, `status`, `assigned_by`, `assigned_at`, `completed_at`) VALUES
(1, 1, 1, 1, 'Provide first aid support', NULL, 'COMPLETED', 0, '2026-08-31 17:35:52', '2026-08-31 17:40:52');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `audit_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action_type` varchar(30) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`audit_id`, `user_id`, `action_type`, `entity_type`, `entity_id`, `description`, `created_at`) VALUES
(1, NULL, 'INSERT', 'SHELTER_ADMISSION', 2, 'Family ID 2 admitted to Shelter ID 1 with 2 member(s)', '2026-08-31 16:29:22'),
(2, 7, 'INSERT', 'SHELTER_ADMISSION', 3, 'Family ID 1 admitted to Shelter ID 1 with 4 member(s)', '2026-09-17 18:15:01'),
(3, 7, 'INSERT', 'SHELTER_ADMISSION', 4, 'Family ID 1 admitted to Shelter ID 1 with 4 member(s)', '2026-09-17 18:28:28'),
(4, 2, 'INSERT', 'SHELTER_ADMISSION', 5, 'Family ID 1 admitted to Shelter ID 1 with 4 member(s)', '2026-09-17 18:29:56');

-- --------------------------------------------------------

--
-- Table structure for table `disasters`
--

CREATE TABLE `disasters` (
  `disaster_id` int(10) UNSIGNED NOT NULL,
  `disaster_code` varchar(20) NOT NULL,
  `disaster_name` varchar(120) NOT NULL,
  `disaster_type` enum('FLOOD','CYCLONE','EARTHQUAKE','LANDSLIDE','DROUGHT','OTHER') NOT NULL,
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('ACTIVE','ENDED') DEFAULT 'ACTIVE',
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `disasters`
--

INSERT INTO `disasters` (`disaster_id`, `disaster_code`, `disaster_name`, `disaster_type`, `severity`, `start_date`, `end_date`, `status`, `description`, `created_at`) VALUES
(1, 'DIS-001', 'Feni Flood 2026', 'FLOOD', 'CRITICAL', '2026-08-20', NULL, 'ACTIVE', 'Severe flood affecting coastal and river areas', '2026-09-01 17:08:57');

-- --------------------------------------------------------

--
-- Table structure for table `disaster_areas`
--

CREATE TABLE `disaster_areas` (
  `area_id` int(10) UNSIGNED NOT NULL,
  `disaster_id` int(10) UNSIGNED NOT NULL,
  `district` varchar(80) NOT NULL,
  `upazila` varchar(80) DEFAULT NULL,
  `union_name` varchar(80) DEFAULT NULL,
  `affected_population` int(10) UNSIGNED DEFAULT NULL,
  `damage_level` enum('LOW','MEDIUM','HIGH','SEVERE') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `disaster_areas`
--

INSERT INTO `disaster_areas` (`area_id`, `disaster_id`, `district`, `upazila`, `union_name`, `affected_population`, `damage_level`) VALUES
(1, 1, 'Feni', 'Sonagazi', 'Char Majlishpur', 50000, 'SEVERE');

-- --------------------------------------------------------

--
-- Table structure for table `distributions`
--

CREATE TABLE `distributions` (
  `distribution_id` bigint(20) UNSIGNED NOT NULL,
  `distribution_code` varchar(20) NOT NULL,
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('PENDING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `distributed_by` bigint(20) UNSIGNED NOT NULL,
  `distributed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `distributions`
--

INSERT INTO `distributions` (`distribution_id`, `distribution_code`, `request_id`, `status`, `distributed_by`, `distributed_at`, `notes`) VALUES
(2, 'DIST-1788526074993', 4, 'COMPLETED', 1, '2026-09-04 12:47:54', 'Rice distributed to shelter'),
(3, 'DIST-1789676001967', 4, 'COMPLETED', 2, '2026-09-17 20:13:21', 'Distribution test'),
(4, 'DIST-1789676502728', 4, 'COMPLETED', 2, '2026-09-17 20:21:42', 'Distribution test'),
(6, 'DIST-1789676862833', 4, 'COMPLETED', 2, '2026-09-17 20:27:42', 'Distribution test'),
(7, 'DIST-1789691460685', 13, 'COMPLETED', 8, '2026-09-18 00:31:00', NULL),
(8, 'DIST-1789693426424', 13, 'PENDING', 8, '2026-09-18 01:03:46', 'Food distribution'),
(9, 'DIST-1789694148930', 14, 'PENDING', 2, '2026-09-18 01:15:48', 'Food distribution');

-- --------------------------------------------------------

--
-- Table structure for table `distribution_items`
--

CREATE TABLE `distribution_items` (
  `distribution_item_id` bigint(20) UNSIGNED NOT NULL,
  `distribution_id` bigint(20) UNSIGNED NOT NULL,
  `request_item_id` bigint(20) UNSIGNED NOT NULL,
  `item_id` int(10) UNSIGNED NOT NULL,
  `quantity` decimal(12,2) NOT NULL
) ;

--
-- Dumping data for table `distribution_items`
--

INSERT INTO `distribution_items` (`distribution_item_id`, `distribution_id`, `request_item_id`, `item_id`, `quantity`) VALUES
(6, 2, 2, 1, 200.00),
(12, 6, 2, 1, 50.00),
(13, 7, 2, 1, 50.00),
(15, 8, 2, 1, 50.00),
(16, 8, 6, 1, 50.00);

-- --------------------------------------------------------

--
-- Table structure for table `donations`
--

CREATE TABLE `donations` (
  `donation_id` bigint(20) UNSIGNED NOT NULL,
  `donation_code` varchar(20) NOT NULL,
  `donor_id` bigint(20) UNSIGNED NOT NULL,
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `status` enum('PENDING','RECEIVED','CANCELLED') DEFAULT 'PENDING',
  `received_by` bigint(20) UNSIGNED NOT NULL,
  `received_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donations`
--

INSERT INTO `donations` (`donation_id`, `donation_code`, `donor_id`, `shelter_id`, `status`, `received_by`, `received_at`, `notes`) VALUES
(1, 'DNT-001', 1, 1, 'RECEIVED', 1, '2026-08-31 17:17:45', NULL),
(2, 'DON-1789678473095', 1, 1, 'RECEIVED', 2, '2026-09-17 20:54:33', 'Food donation test');

-- --------------------------------------------------------

--
-- Table structure for table `donation_items`
--

CREATE TABLE `donation_items` (
  `donation_id` bigint(20) UNSIGNED NOT NULL,
  `item_id` int(10) UNSIGNED NOT NULL,
  `quantity` decimal(12,2) NOT NULL
) ;

--
-- Dumping data for table `donation_items`
--

INSERT INTO `donation_items` (`donation_id`, `item_id`, `quantity`) VALUES
(1, 1, 100.00),
(2, 1, 100.00),
(2, 2, 50.00);

-- --------------------------------------------------------

--
-- Table structure for table `donors`
--

CREATE TABLE `donors` (
  `donor_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `donor_code` varchar(20) NOT NULL,
  `donor_name` varchar(120) NOT NULL,
  `donor_type` enum('INDIVIDUAL','ORGANIZATION','ANONYMOUS') NOT NULL DEFAULT 'INDIVIDUAL',
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donors`
--

INSERT INTO `donors` (`donor_id`, `user_id`, `donor_code`, `donor_name`, `donor_type`, `phone`, `email`, `created_at`) VALUES
(1, NULL, 'DON-001', 'Helping Hands Foundation', 'ORGANIZATION', '01711111111', 'contact@helpinghands.org', '2026-08-31 17:15:48');

-- --------------------------------------------------------

--
-- Table structure for table `emergency_registrations`
--

CREATE TABLE `emergency_registrations` (
  `emergency_id` int(11) NOT NULL,
  `family_name` varchar(100) NOT NULL,
  `member_count` int(11) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
  `registration_status` enum('PENDING','VERIFIED') DEFAULT 'PENDING',
  `sync_status` enum('LOCAL','SYNCED') DEFAULT 'LOCAL',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emergency_registrations`
--

INSERT INTO `emergency_registrations` (`emergency_id`, `family_name`, `member_count`, `phone`, `location`, `priority`, `registration_status`, `sync_status`, `created_at`) VALUES
(1, 'Rahim', 5, NULL, 'Feni', 'MEDIUM', 'PENDING', 'SYNCED', '2026-09-05 09:48:24'),
(2, 'Karim', 4, NULL, 'Noakhali', 'HIGH', 'PENDING', 'SYNCED', '2026-09-05 09:48:24');

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
  `status` enum('NEEDS_SHELTER','WAITING_FOR_SHELTER','SHELTERED','RELOCATED','CLOSED') DEFAULT 'NEEDS_SHELTER',
  `registered_by` bigint(20) UNSIGNED DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `families`
--

INSERT INTO `families` (`family_id`, `family_code`, `contact_phone`, `current_district`, `current_area`, `priority`, `status`, `registered_by`, `registered_at`) VALUES
(1, 'FAM-001', '01800000001', 'Feni', 'Sonagazi', 'HIGH', 'SHELTERED', NULL, '2026-08-31 15:58:30'),
(2, 'FAM-002', '01800000002', 'Feni', 'Daganbhuiyan', 'MEDIUM', 'SHELTERED', NULL, '2026-08-31 16:16:44'),
(4, 'FAM-003', '01800000000', 'Feni', 'Sonagazi', 'HIGH', 'NEEDS_SHELTER', NULL, '2026-09-11 17:24:34');

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

--
-- Dumping data for table `family_members`
--

INSERT INTO `family_members` (`member_id`, `family_id`, `full_name`, `age_years`, `sex`, `is_head`, `relationship_to_head`, `created_at`) VALUES
(1, 1, 'Karim Uddin', 42, 'MALE', 1, 'HEAD', '2026-08-31 15:58:30'),
(2, 1, 'Salma Begum', 37, 'FEMALE', 0, 'SPOUSE', '2026-08-31 15:58:30'),
(3, 1, 'Rafi Uddin', 12, 'MALE', 0, 'CHILD', '2026-08-31 15:58:30'),
(4, 2, 'Hasan Ali', 48, 'MALE', 1, 'HEAD', '2026-08-31 16:29:00'),
(5, 2, 'Nusrat Begum', 44, 'FEMALE', 0, 'SPOUSE', '2026-08-31 16:29:00');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `txn_id` bigint(20) UNSIGNED NOT NULL,
  `inventory_id` bigint(20) UNSIGNED NOT NULL,
  `txn_type` enum('IN','OUT','ADJUSTMENT_IN','ADJUSTMENT_OUT') NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `balance_after` decimal(12,2) NOT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`txn_id`, `inventory_id`, `txn_type`, `quantity`, `balance_after`, `reference_type`, `reference_id`, `notes`, `created_by`, `created_at`) VALUES
(1, 1, 'IN', 40.00, 40.00, 'MANUAL_STOCK_IN', NULL, 'Stock added through sp_add_stock', 1, '2026-08-31 16:46:09'),
(2, 1, 'IN', 100.00, 140.00, 'MANUAL_STOCK_IN', NULL, 'Stock added through sp_add_stock', 1, '2026-08-31 17:09:44'),
(3, 1, 'OUT', 50.00, 90.00, 'DISTRIBUTION', 1, 'Relief distribution', 1, '2026-08-31 17:10:00'),
(4, 1, 'IN', 100.00, 190.00, 'DONATION', 1, 'Stock received from donation', 1, '2026-08-31 17:17:45'),
(5, 1, 'IN', 100.00, 200.00, 'INVENTORY_ADD', NULL, NULL, 7, '2026-09-17 19:19:19'),
(6, 1, 'OUT', 50.00, 150.00, 'DISTRIBUTION', 6, NULL, 2, '2026-09-17 20:27:42'),
(7, 1, 'IN', 100.00, 250.00, 'DONATION', 2, NULL, 2, '2026-09-17 20:54:33'),
(8, 2, 'IN', 50.00, 50.00, 'DONATION', 2, NULL, 2, '2026-09-17 20:54:33'),
(9, 1, 'IN', 50.00, 300.00, 'INVENTORY_ADD', NULL, NULL, 8, '2026-09-17 22:50:06'),
(10, 1, 'OUT', 20.00, 280.00, 'INVENTORY_REDUCE', NULL, NULL, 8, '2026-09-17 23:29:04'),
(13, 1, 'OUT', 50.00, 180.00, 'DISTRIBUTION', 8, 'Relief distribution', 8, '2026-09-18 01:04:36'),
(14, 1, 'OUT', 50.00, 130.00, 'DISTRIBUTION', 8, 'Relief distribution', 2, '2026-09-18 01:19:24');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(10) UNSIGNED NOT NULL,
  `category_id` smallint(5) UNSIGNED NOT NULL,
  `item_code` varchar(20) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`item_id`, `category_id`, `item_code`, `item_name`, `unit`, `is_active`, `created_at`) VALUES
(1, 1, 'ITEM-001', 'Rice', 'KG', 1, '2026-08-31 16:39:23'),
(2, 2, 'ITEM-002', 'Drinking Water', 'Bottle', 1, '2026-08-31 16:39:23'),
(3, 3, 'ITEM-003', 'Oral Saline', 'Pack', 1, '2026-08-31 16:39:23'),
(4, 5, 'ITEM-004', 'Blanket', 'Piece', 1, '2026-08-31 16:39:23');

-- --------------------------------------------------------

--
-- Table structure for table `item_categories`
--

CREATE TABLE `item_categories` (
  `category_id` smallint(5) UNSIGNED NOT NULL,
  `category_name` varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_categories`
--

INSERT INTO `item_categories` (`category_id`, `category_name`) VALUES
(1, 'Food'),
(4, 'Hygiene'),
(3, 'Medicine'),
(5, 'Shelter Item'),
(2, 'Water');

-- --------------------------------------------------------

--
-- Table structure for table `medical_assignments`
--

CREATE TABLE `medical_assignments` (
  `assignment_id` int(11) NOT NULL,
  `medical_request_id` int(11) NOT NULL,
  `medical_team_id` int(11) DEFAULT NULL,
  `volunteer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('ASSIGNED','COMPLETED') DEFAULT 'ASSIGNED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_assignments`
--

INSERT INTO `medical_assignments` (`assignment_id`, `medical_request_id`, `medical_team_id`, `volunteer_id`, `assigned_at`, `status`) VALUES
(2, 1, 1, 1, '2026-09-11 13:30:53', 'COMPLETED'),
(5, 2, 1, NULL, '2026-09-11 13:59:12', 'ASSIGNED');

-- --------------------------------------------------------

--
-- Table structure for table `medical_requests`
--

CREATE TABLE `medical_requests` (
  `medical_request_id` int(11) NOT NULL,
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `problem_description` text NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','EMERGENCY') DEFAULT 'MEDIUM',
  `status` enum('PENDING','ASSIGNED','COMPLETED') DEFAULT 'PENDING',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_requests`
--

INSERT INTO `medical_requests` (`medical_request_id`, `family_id`, `problem_description`, `priority`, `status`, `requested_at`) VALUES
(1, 1, 'Patient injured during flood', 'EMERGENCY', 'COMPLETED', '2026-09-11 12:41:10'),
(2, 1, 'Patient needs urgent medical support', 'EMERGENCY', 'ASSIGNED', '2026-09-11 13:58:36'),
(3, 1, 'High fever after flood', 'EMERGENCY', 'PENDING', '2026-09-11 19:03:29');

-- --------------------------------------------------------

--
-- Stand-in structure for view `medical_support_view`
-- (See below for the actual view)
--
CREATE TABLE `medical_support_view` (
`medical_request_id` int(11)
,`family_code` varchar(20)
,`current_district` varchar(80)
,`problem_description` text
,`priority` enum('LOW','MEDIUM','HIGH','EMERGENCY')
,`status` enum('PENDING','ASSIGNED','COMPLETED')
,`assigned_person` varchar(100)
,`role` enum('DOCTOR','NURSE','MEDICAL_VOLUNTEER')
);

-- --------------------------------------------------------

--
-- Table structure for table `medical_teams`
--

CREATE TABLE `medical_teams` (
  `medical_team_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('DOCTOR','NURSE','MEDICAL_VOLUNTEER') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `availability` enum('AVAILABLE','BUSY','OFFLINE') DEFAULT 'AVAILABLE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_teams`
--

INSERT INTO `medical_teams` (`medical_team_id`, `name`, `role`, `phone`, `location`, `availability`, `created_at`) VALUES
(1, 'Dr. Rahman', 'DOCTOR', '01711111111', 'Sylhet', 'AVAILABLE', '2026-09-11 12:29:32'),
(2, 'Nurse Karim', 'NURSE', '01722222222', 'Sylhet', 'AVAILABLE', '2026-09-11 12:29:32'),
(3, 'First Aid Volunteer Team', 'MEDICAL_VOLUNTEER', '01733333333', 'Sunamganj', 'AVAILABLE', '2026-09-11 12:29:32');

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
-- Table structure for table `offline_sync_queue`
--

CREATE TABLE `offline_sync_queue` (
  `sync_id` int(11) NOT NULL,
  `device_id` varchar(100) NOT NULL,
  `data_type` varchar(50) NOT NULL,
  `record_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`record_data`)),
  `sync_status` enum('PENDING','SYNCED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `synced_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `offline_sync_queue`
--

INSERT INTO `offline_sync_queue` (`sync_id`, `device_id`, `data_type`, `record_data`, `sync_status`, `created_at`, `synced_at`) VALUES
(1, 'DEVICE-001', 'FAMILY', '{\"name\":\"Rahim\",\"members\":5,\"location\":\"Feni\"}', 'SYNCED', '2026-09-05 09:29:00', '2026-09-05 09:48:24'),
(2, 'DEVICE-001', 'FAMILY', '{\"name\":\"Karim\",\"members\":4,\"location\":\"Noakhali\",\"priority\":\"HIGH\"}', 'SYNCED', '2026-09-05 09:37:12', '2026-09-05 09:48:24');

-- --------------------------------------------------------

--
-- Table structure for table `relief_requests`
--

CREATE TABLE `relief_requests` (
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `request_code` varchar(20) NOT NULL,
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` enum('REQUESTED','APPROVED','PARTIALLY_DELIVERED','DELIVERED','REJECTED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  `requested_by` bigint(20) UNSIGNED NOT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `relief_requests`
--

INSERT INTO `relief_requests` (`request_id`, `request_code`, `shelter_id`, `priority`, `status`, `requested_by`, `requested_at`, `approved_by`, `approved_at`, `notes`) VALUES
(4, 'REQ-1788523378670', 1, 'HIGH', 'PARTIALLY_DELIVERED', 1, '2026-09-04 12:02:58', NULL, NULL, 'Need rice and water'),
(6, 'REQ-1789662391388', 1, 'HIGH', 'APPROVED', 2, '2026-09-17 16:26:31', 2, '2026-09-17 16:27:46', 'Need food and medicine'),
(7, 'REQ-1789670494525', 2, 'MEDIUM', 'APPROVED', 2, '2026-09-17 18:41:34', 8, '2026-09-17 18:44:53', 'Admin test request'),
(8, 'REQ-1789670934413', 1, 'HIGH', 'REQUESTED', 7, '2026-09-17 18:48:54', NULL, NULL, 'Need food and medicine'),
(9, 'REQ-1789688414343', 1, 'HIGH', 'REQUESTED', 7, '2026-09-17 23:40:14', NULL, NULL, 'Need food and medicine'),
(10, 'REQ-1789688488561', 1, 'HIGH', 'REQUESTED', 7, '2026-09-17 23:41:28', NULL, NULL, 'Need food and medicine'),
(11, 'REQ-1789689026450', 1, 'HIGH', 'REQUESTED', 7, '2026-09-17 23:50:26', NULL, NULL, 'Need food and medicine'),
(12, 'REQ-1789689412229', 1, 'HIGH', 'REQUESTED', 7, '2026-09-17 23:56:52', NULL, NULL, 'Need food and medicine'),
(13, 'REQ-1789689613253', 1, 'HIGH', 'APPROVED', 7, '2026-09-18 00:00:13', 8, '2026-09-18 00:02:19', 'Need food and medicine'),
(14, 'REQ-1789693892468', 1, 'HIGH', 'PARTIALLY_DELIVERED', 2, '2026-09-18 01:11:32', 2, '2026-09-18 01:14:07', 'Need food items');

-- --------------------------------------------------------

--
-- Table structure for table `relief_request_items`
--

CREATE TABLE `relief_request_items` (
  `request_item_id` bigint(20) UNSIGNED NOT NULL,
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `item_id` int(10) UNSIGNED NOT NULL,
  `requested_qty` decimal(12,2) NOT NULL,
  `fulfilled_qty` decimal(12,2) NOT NULL DEFAULT 0.00
) ;

--
-- Dumping data for table `relief_request_items`
--

INSERT INTO `relief_request_items` (`request_item_id`, `request_id`, `item_id`, `requested_qty`, `fulfilled_qty`) VALUES
(2, 4, 1, 300.00, 150.00),
(3, 4, 2, 200.00, 0.00),
(5, 13, 1, 100.00, 0.00),
(6, 14, 1, 100.00, 50.00);

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
  `operational_status` enum('OPEN','FULL','TEMPORARILY_CLOSED','DAMAGED','EVACUATING') DEFAULT 'OPEN',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `current_occupancy` int(11) DEFAULT 0
) ;

--
-- Dumping data for table `shelters`
--

INSERT INTO `shelters` (`shelter_id`, `shelter_code`, `shelter_name`, `shelter_type`, `district`, `upazila`, `address`, `total_capacity`, `operational_status`, `created_by`, `created_at`, `current_occupancy`) VALUES
(1, 'SH-001', 'Feni Central Shelter', 'COLLECTIVE', 'Feni', 'Feni Sadar', 'Feni Government School', 500, 'OPEN', NULL, '2026-08-31 15:58:30', 500),
(2, 'SH-002', 'Feni School Shelter', 'TEMPORARY', 'Feni', 'Feni Sadar', 'Feni School Road', 400, 'OPEN', NULL, '2026-09-08 08:17:04', 150);

-- --------------------------------------------------------

--
-- Table structure for table `shelter_admissions`
--

CREATE TABLE `shelter_admissions` (
  `admission_id` bigint(20) UNSIGNED NOT NULL,
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `admitted_member_count` int(10) UNSIGNED NOT NULL,
  `admitted_by` bigint(20) UNSIGNED NOT NULL,
  `admitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `discharged_at` timestamp NULL DEFAULT NULL,
  `status` enum('ACTIVE','DISCHARGED','CANCELLED') NOT NULL DEFAULT 'ACTIVE'
) ;

--
-- Dumping data for table `shelter_admissions`
--

INSERT INTO `shelter_admissions` (`admission_id`, `family_id`, `shelter_id`, `admitted_member_count`, `admitted_by`, `admitted_at`, `discharged_at`, `status`) VALUES
(1, 1, 1, 3, 1, '2026-08-31 16:09:57', NULL, 'ACTIVE'),
(2, 2, 1, 2, 1, '2026-08-31 16:29:22', NULL, 'ACTIVE'),
(3, 1, 1, 4, 7, '2026-09-17 18:15:01', NULL, 'ACTIVE'),
(4, 1, 1, 4, 7, '2026-09-17 18:28:28', NULL, 'ACTIVE'),
(5, 1, 1, 4, 2, '2026-09-17 18:29:56', NULL, 'ACTIVE');

--
-- Triggers `shelter_admissions`
--
DELIMITER $$
CREATE TRIGGER `trg_admission_after_insert` AFTER INSERT ON `shelter_admissions` FOR EACH ROW BEGIN

    INSERT INTO audit_logs
    (
        user_id,
        action_type,
        entity_type,
        entity_id,
        description
    )

    VALUES
    (
        NEW.admitted_by,
        'INSERT',
        'SHELTER_ADMISSION',
        NEW.admission_id,

        CONCAT(
            'Family ID ',
            NEW.family_id,
            ' admitted to Shelter ID ',
            NEW.shelter_id,
            ' with ',
            NEW.admitted_member_count,
            ' member(s)'
        )
    );

END
$$
DELIMITER ;

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
-- Table structure for table `shelter_inventory`
--

CREATE TABLE `shelter_inventory` (
  `inventory_id` bigint(20) UNSIGNED NOT NULL,
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `item_id` int(10) UNSIGNED NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reorder_level` decimal(12,2) NOT NULL DEFAULT 0.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `shelter_inventory`
--

INSERT INTO `shelter_inventory` (`inventory_id`, `shelter_id`, `item_id`, `quantity`, `reorder_level`, `updated_at`) VALUES
(1, 1, 1, 130.00, 30.00, '2026-09-18 01:19:24'),
(2, 1, 2, 50.00, 50.00, '2026-09-17 20:54:33'),
(3, 1, 3, 0.00, 20.00, '2026-08-31 16:39:23'),
(4, 1, 4, 0.00, 10.00, '2026-08-31 16:39:23');

-- --------------------------------------------------------

--
-- Table structure for table `shelter_managers`
--

CREATE TABLE `shelter_managers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shelter_id` int(10) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shelter_managers`
--

INSERT INTO `shelter_managers` (`id`, `shelter_id`, `user_id`, `assigned_at`) VALUES
(1, 1, 7, '2026-09-17 17:53:11');

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `skill_id` smallint(5) UNSIGNED NOT NULL,
  `skill_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`skill_id`, `skill_name`, `description`) VALUES
(1, 'First Aid', 'Ability to provide basic medical assistance and first aid during emergency situations'),
(2, 'Driving', 'Ability to operate vehicles and provide transportation support during disaster response'),
(3, 'Shelter Management', 'Ability to manage shelter activities, organize displaced people and maintain shelter facilities'),
(4, 'Food Distribution', 'Ability to distribute food and relief materials among affected people'),
(5, 'Logistics', 'Ability to manage resources, organize supplies and support disaster logistics operations'),
(7, 'Emergency Medical Support', 'Ability to provide emergency healthcare support during disasters'),
(8, 'Patient Care', 'Ability to assist injured and affected people'),
(9, 'Medicine Handling', 'Ability to manage and distribute basic medicines');

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

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `full_name`, `email`, `password_hash`, `phone`, `status`, `created_at`) VALUES
(1, 1, 'Admin User', 'admin@reliefsync.com', '$2b$10$gszwV7lbqvv2kfd6CMzdQO2ylLQpTn3Q8SPCowjxJQzZ81m31D.zO', '01700000000', 'ACTIVE', '2026-09-04 11:59:15'),
(2, 1, 'Test Admin', 'admin@test.com', '$2b$10$xs84hGgIDNy7KUaC8aNASOzrSjYm4LisTiNLU0KTJGOH.TrzT/4Qi', '01700000000', 'ACTIVE', '2026-09-17 12:36:29'),
(5, 4, 'Test Volunteer', 'volunteer@test.com', '$2b$10$m//MzD0PNZhu.UTgZrM2werhJiVLr8191xNdgtAHO5/KNMHRPx0j2', '01800000000', 'ACTIVE', '2026-09-17 13:57:42'),
(6, 1, 'System Admin', 'admin@sync.com', '$2b$10$5Uco3Tpiys1eF5M14CBR..0mc6p2JsrRqsue/9ljT7l7j.Jcg4FHy', '01700000001', 'ACTIVE', '2026-09-17 17:44:19'),
(7, 2, 'Shelter Manager A', 'manager@reliefsync.com', '$2b$10$hSh6nZ1ZhdqW/RP.5GoJaOPZBhsFDRloDVl.0otq4sa9rGcHDVTIq', '01700000002', 'ACTIVE', '2026-09-17 17:44:27'),
(8, 3, 'Relief Manager A', 'relief@reliefsync.com', '$2b$10$MCpHMlWV97gpzdkYQmZve.xZE46V5CfhQ4mYq1zyIBEnBs/JzXuq2', '01700000003', 'ACTIVE', '2026-09-17 17:44:40'),
(9, 4, 'Volunteer A', 'volunteer@reliefsync.com', '$2b$10$raqc86wIu0tbi4MRJeZMSOm9cMse0wLZKbAQHU8BporZr4KuCtO7C', '01700000004', 'ACTIVE', '2026-09-17 17:44:47'),
(10, 5, 'ABC Foundation', 'donor@reliefsync.com', '$2b$10$Nemwcczt70lUKqXOzsUsoufUdGissDapKfDUNa5WclF5YTPPknQJu', '01700000005', 'ACTIVE', '2026-09-17 17:44:54');

-- --------------------------------------------------------

--
-- Table structure for table `volunteers`
--

CREATE TABLE `volunteers` (
  `volunteer_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `volunteer_code` varchar(20) NOT NULL,
  `volunteer_name` varchar(120) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `availability` enum('AVAILABLE','BUSY','INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `volunteers`
--

INSERT INTO `volunteers` (`volunteer_id`, `user_id`, `volunteer_code`, `volunteer_name`, `phone`, `email`, `availability`, `created_at`) VALUES
(1, NULL, 'VOL-001', 'Arif Hossain', '01900000001', 'arif@example.com', 'BUSY', '2026-08-31 17:23:39'),
(3, NULL, 'VOL-002', 'Rahim Ahmed', '01800000000', 'rahim@example.com', 'AVAILABLE', '2026-09-11 17:13:38');

-- --------------------------------------------------------

--
-- Table structure for table `volunteer_skills`
--

CREATE TABLE `volunteer_skills` (
  `volunteer_id` bigint(20) UNSIGNED NOT NULL,
  `skill_id` smallint(5) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `volunteer_skills`
--

INSERT INTO `volunteer_skills` (`volunteer_id`, `skill_id`) VALUES
(1, 1),
(1, 2),
(1, 7),
(1, 8),
(1, 9),
(3, 7);

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
-- Structure for view `medical_support_view`
--
DROP TABLE IF EXISTS `medical_support_view`;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `medical_support_view`  AS SELECT `mr`.`medical_request_id` AS `medical_request_id`, `f`.`family_code` AS `family_code`, `f`.`current_district` AS `current_district`, `mr`.`problem_description` AS `problem_description`, `mr`.`priority` AS `priority`, `mr`.`status` AS `status`, `mt`.`name` AS `assigned_person`, `mt`.`role` AS `role` FROM (((`medical_requests` `mr` join `families` `f` on(`mr`.`family_id` = `f`.`family_id`)) left join `medical_assignments` `ma` on(`mr`.`medical_request_id` = `ma`.`medical_request_id`)) left join `medical_teams` `mt` on(`ma`.`medical_team_id` = `mt`.`medical_team_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_shelter_capacity`
--
DROP TABLE IF EXISTS `vw_shelter_capacity`;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `vw_shelter_capacity`  AS SELECT `s`.`shelter_id` AS `shelter_id`, `s`.`shelter_code` AS `shelter_code`, `s`.`shelter_name` AS `shelter_name`, `s`.`district` AS `district`, `s`.`total_capacity` AS `total_capacity`, coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) AS `current_occupancy`, `s`.`total_capacity`- coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) AS `available_capacity`, CASE WHEN `s`.`operational_status` = 'CLOSED' THEN 'CLOSED' WHEN coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) >= `s`.`total_capacity` THEN 'FULL' WHEN coalesce(sum(case when `sa`.`status` = 'ACTIVE' then `sa`.`admitted_member_count` else 0 end),0) >= `s`.`total_capacity` * 0.80 THEN 'NEARLY_FULL' ELSE 'AVAILABLE' END AS `capacity_status` FROM (`shelters` `s` left join `shelter_admissions` `sa` on(`s`.`shelter_id` = `sa`.`shelter_id`)) GROUP BY `s`.`shelter_id`, `s`.`shelter_code`, `s`.`shelter_name`, `s`.`district`, `s`.`total_capacity`, `s`.`operational_status` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `fk_assignment_volunteer` (`volunteer_id`),
  ADD KEY `fk_assignment_shelter` (`shelter_id`),
  ADD KEY `fk_assignment_skill` (`skill_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `fk_audit_user` (`user_id`),
  ADD KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_created_at` (`created_at`);

--
-- Indexes for table `disasters`
--
ALTER TABLE `disasters`
  ADD PRIMARY KEY (`disaster_id`),
  ADD UNIQUE KEY `disaster_code` (`disaster_code`);

--
-- Indexes for table `disaster_areas`
--
ALTER TABLE `disaster_areas`
  ADD PRIMARY KEY (`area_id`),
  ADD KEY `fk_area_disaster` (`disaster_id`);

--
-- Indexes for table `distributions`
--
ALTER TABLE `distributions`
  ADD PRIMARY KEY (`distribution_id`),
  ADD UNIQUE KEY `distribution_code` (`distribution_code`),
  ADD KEY `fk_distribution_request` (`request_id`),
  ADD KEY `fk_distribution_user` (`distributed_by`);

--
-- Indexes for table `distribution_items`
--
ALTER TABLE `distribution_items`
  ADD PRIMARY KEY (`distribution_item_id`),
  ADD UNIQUE KEY `distribution_id` (`distribution_id`,`request_item_id`),
  ADD KEY `fk_distribution_request_item` (`request_item_id`),
  ADD KEY `fk_dist_item_item` (`item_id`);

--
-- Indexes for table `donations`
--
ALTER TABLE `donations`
  ADD PRIMARY KEY (`donation_id`),
  ADD UNIQUE KEY `donation_code` (`donation_code`),
  ADD KEY `fk_donation_donor` (`donor_id`),
  ADD KEY `fk_donation_shelter` (`shelter_id`),
  ADD KEY `fk_donation_received_by` (`received_by`);

--
-- Indexes for table `donation_items`
--
ALTER TABLE `donation_items`
  ADD PRIMARY KEY (`donation_id`,`item_id`),
  ADD KEY `fk_donation_item_item` (`item_id`);

--
-- Indexes for table `donors`
--
ALTER TABLE `donors`
  ADD PRIMARY KEY (`donor_id`),
  ADD UNIQUE KEY `donor_code` (`donor_code`),
  ADD KEY `fk_donor_user` (`user_id`);

--
-- Indexes for table `emergency_registrations`
--
ALTER TABLE `emergency_registrations`
  ADD PRIMARY KEY (`emergency_id`);

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
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`txn_id`),
  ADD KEY `fk_txn_inventory` (`inventory_id`),
  ADD KEY `fk_txn_user` (`created_by`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `item_code` (`item_code`),
  ADD KEY `fk_item_category` (`category_id`);

--
-- Indexes for table `item_categories`
--
ALTER TABLE `item_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `medical_assignments`
--
ALTER TABLE `medical_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `idx_assignment_request` (`medical_request_id`),
  ADD KEY `idx_assignment_team` (`medical_team_id`),
  ADD KEY `fk_medical_assignment_volunteer` (`volunteer_id`);

--
-- Indexes for table `medical_requests`
--
ALTER TABLE `medical_requests`
  ADD PRIMARY KEY (`medical_request_id`),
  ADD KEY `idx_medical_request_family` (`family_id`),
  ADD KEY `idx_medical_request_status` (`status`);

--
-- Indexes for table `medical_teams`
--
ALTER TABLE `medical_teams`
  ADD PRIMARY KEY (`medical_team_id`);

--
-- Indexes for table `member_special_needs`
--
ALTER TABLE `member_special_needs`
  ADD PRIMARY KEY (`member_id`,`need_id`),
  ADD KEY `fk_msn_need` (`need_id`);

--
-- Indexes for table `offline_sync_queue`
--
ALTER TABLE `offline_sync_queue`
  ADD PRIMARY KEY (`sync_id`);

--
-- Indexes for table `relief_requests`
--
ALTER TABLE `relief_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD UNIQUE KEY `request_code` (`request_code`),
  ADD KEY `fk_request_shelter` (`shelter_id`),
  ADD KEY `fk_request_approved_by` (`approved_by`),
  ADD KEY `fk_request_requested_by` (`requested_by`);

--
-- Indexes for table `relief_request_items`
--
ALTER TABLE `relief_request_items`
  ADD PRIMARY KEY (`request_item_id`),
  ADD UNIQUE KEY `request_id` (`request_id`,`item_id`),
  ADD KEY `fk_request_item_item` (`item_id`);

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
-- Indexes for table `shelter_inventory`
--
ALTER TABLE `shelter_inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `uq_shelter_inventory` (`shelter_id`,`item_id`),
  ADD KEY `fk_inventory_item` (`item_id`);

--
-- Indexes for table `shelter_managers`
--
ALTER TABLE `shelter_managers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `fk_sm_shelter` (`shelter_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`skill_id`),
  ADD UNIQUE KEY `skill_name` (`skill_name`);

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
-- Indexes for table `volunteers`
--
ALTER TABLE `volunteers`
  ADD PRIMARY KEY (`volunteer_id`),
  ADD UNIQUE KEY `volunteer_code` (`volunteer_code`),
  ADD KEY `fk_volunteer_user` (`user_id`);

--
-- Indexes for table `volunteer_skills`
--
ALTER TABLE `volunteer_skills`
  ADD PRIMARY KEY (`volunteer_id`,`skill_id`),
  ADD UNIQUE KEY `unique_volunteer_skill` (`volunteer_id`,`skill_id`),
  ADD KEY `fk_vs_skill` (`skill_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `assignment_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `audit_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `disasters`
--
ALTER TABLE `disasters`
  MODIFY `disaster_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `disaster_areas`
--
ALTER TABLE `disaster_areas`
  MODIFY `area_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `distributions`
--
ALTER TABLE `distributions`
  MODIFY `distribution_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `distribution_items`
--
ALTER TABLE `distribution_items`
  MODIFY `distribution_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `donations`
--
ALTER TABLE `donations`
  MODIFY `donation_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `donors`
--
ALTER TABLE `donors`
  MODIFY `donor_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `emergency_registrations`
--
ALTER TABLE `emergency_registrations`
  MODIFY `emergency_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `facilities`
--
ALTER TABLE `facilities`
  MODIFY `facility_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `families`
--
ALTER TABLE `families`
  MODIFY `family_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `family_members`
--
ALTER TABLE `family_members`
  MODIFY `member_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `txn_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `item_categories`
--
ALTER TABLE `item_categories`
  MODIFY `category_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `medical_assignments`
--
ALTER TABLE `medical_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `medical_requests`
--
ALTER TABLE `medical_requests`
  MODIFY `medical_request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `medical_teams`
--
ALTER TABLE `medical_teams`
  MODIFY `medical_team_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `offline_sync_queue`
--
ALTER TABLE `offline_sync_queue`
  MODIFY `sync_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `relief_requests`
--
ALTER TABLE `relief_requests`
  MODIFY `request_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `relief_request_items`
--
ALTER TABLE `relief_request_items`
  MODIFY `request_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `shelter_inventory`
--
ALTER TABLE `shelter_inventory`
  MODIFY `inventory_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shelter_managers`
--
ALTER TABLE `shelter_managers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `skill_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `special_need_types`
--
ALTER TABLE `special_need_types`
  MODIFY `need_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `volunteers`
--
ALTER TABLE `volunteers`
  MODIFY `volunteer_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `fk_assignment_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters` (`shelter_id`),
  ADD CONSTRAINT `fk_assignment_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`),
  ADD CONSTRAINT `fk_assignment_volunteer` FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers` (`volunteer_id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `disaster_areas`
--
ALTER TABLE `disaster_areas`
  ADD CONSTRAINT `fk_area_disaster` FOREIGN KEY (`disaster_id`) REFERENCES `disasters` (`disaster_id`) ON DELETE CASCADE;

--
-- Constraints for table `distributions`
--
ALTER TABLE `distributions`
  ADD CONSTRAINT `fk_distribution_request` FOREIGN KEY (`request_id`) REFERENCES `relief_requests` (`request_id`),
  ADD CONSTRAINT `fk_distribution_user` FOREIGN KEY (`distributed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `distribution_items`
--
ALTER TABLE `distribution_items`
  ADD CONSTRAINT `fk_dist_item_distribution` FOREIGN KEY (`distribution_id`) REFERENCES `distributions` (`distribution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dist_item_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_distribution_request_item` FOREIGN KEY (`request_item_id`) REFERENCES `relief_request_items` (`request_item_id`) ON DELETE CASCADE;

--
-- Constraints for table `donations`
--
ALTER TABLE `donations`
  ADD CONSTRAINT `fk_donation_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`),
  ADD CONSTRAINT `fk_donation_received_by` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_donation_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters` (`shelter_id`);

--
-- Constraints for table `donation_items`
--
ALTER TABLE `donation_items`
  ADD CONSTRAINT `fk_donation_item_donation` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`donation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_donation_item_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`);

--
-- Constraints for table `donors`
--
ALTER TABLE `donors`
  ADD CONSTRAINT `fk_donor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

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
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `fk_txn_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `shelter_inventory` (`inventory_id`),
  ADD CONSTRAINT `fk_txn_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`category_id`);

--
-- Constraints for table `medical_assignments`
--
ALTER TABLE `medical_assignments`
  ADD CONSTRAINT `fk_assignment_request` FOREIGN KEY (`medical_request_id`) REFERENCES `medical_requests` (`medical_request_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assignment_team` FOREIGN KEY (`medical_team_id`) REFERENCES `medical_teams` (`medical_team_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_medical_assignment_volunteer` FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers` (`volunteer_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `medical_requests`
--
ALTER TABLE `medical_requests`
  ADD CONSTRAINT `fk_medical_request_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`family_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `member_special_needs`
--
ALTER TABLE `member_special_needs`
  ADD CONSTRAINT `fk_msn_member` FOREIGN KEY (`member_id`) REFERENCES `family_members` (`member_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_msn_need` FOREIGN KEY (`need_id`) REFERENCES `special_need_types` (`need_id`);

--
-- Constraints for table `relief_requests`
--
ALTER TABLE `relief_requests`
  ADD CONSTRAINT `fk_request_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_request_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_request_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters` (`shelter_id`);

--
-- Constraints for table `relief_request_items`
--
ALTER TABLE `relief_request_items`
  ADD CONSTRAINT `fk_request_item_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_request_item_request` FOREIGN KEY (`request_id`) REFERENCES `relief_requests` (`request_id`) ON DELETE CASCADE;

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
-- Constraints for table `shelter_inventory`
--
ALTER TABLE `shelter_inventory`
  ADD CONSTRAINT `fk_inventory_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  ADD CONSTRAINT `fk_inventory_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters` (`shelter_id`);

--
-- Constraints for table `shelter_managers`
--
ALTER TABLE `shelter_managers`
  ADD CONSTRAINT `fk_sm_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters` (`shelter_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);

--
-- Constraints for table `volunteers`
--
ALTER TABLE `volunteers`
  ADD CONSTRAINT `fk_volunteer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `volunteer_skills`
--
ALTER TABLE `volunteer_skills`
  ADD CONSTRAINT `fk_vs_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_vs_volunteer` FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers` (`volunteer_id`) ON DELETE CASCADE;
COMMIT;


-- --------------------------------------------------------
-- Demo data for the default volunteer and donor accounts
-- --------------------------------------------------------

INSERT INTO `volunteers` (`volunteer_id`, `user_id`, `volunteer_code`, `volunteer_name`, `phone`, `email`, `availability`, `created_at`) VALUES
(5, 9, 'VOL-003', 'Volunteer A', '01700000004', 'volunteer@reliefsync.com', 'BUSY', '2026-09-17 17:50:00');

INSERT INTO `volunteer_skills` (`volunteer_id`, `skill_id`) VALUES
(5, 1),
(5, 4);

INSERT INTO `assignments` (`assignment_id`, `volunteer_id`, `shelter_id`, `skill_id`, `task_title`, `task_description`, `status`, `assigned_by`, `assigned_at`, `completed_at`) VALUES
(2, 5, 1, 4, 'Distribute food packs', 'Morning food distribution at Feni Central Shelter', 'ACTIVE', 8, '2026-09-18 08:00:00', NULL),
(3, 5, 1, 1, 'First aid desk', 'Basic first aid for sheltered families', 'COMPLETED', 8, '2026-09-17 09:00:00', '2026-09-17 17:00:00');

INSERT INTO `donors` (`donor_id`, `user_id`, `donor_code`, `donor_name`, `donor_type`, `phone`, `email`, `created_at`) VALUES
(2, 10, 'DNR-U10', 'ABC Foundation', 'ORGANIZATION', '01700000005', 'donor@reliefsync.com', '2026-09-17 17:50:00');

INSERT INTO `donations` (`donation_id`, `donation_code`, `donor_id`, `shelter_id`, `status`, `received_by`, `received_at`, `notes`) VALUES
(3, 'DON-DEMO-0003', 2, 2, 'PENDING', 10, '2026-09-18 10:00:00', 'Winter blankets and drinking water');

INSERT INTO `donation_items` (`donation_id`, `item_id`, `quantity`) VALUES
(3, 4, 50.00),
(3, 2, 120.00);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
