-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 08, 2025 at 11:27 AM
-- Server version: 10.11.14-MariaDB-cll-lve
-- PHP Version: 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = 'SYSTEM';


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ecobricks_earthcal_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `alarms_v1_tb`
--

CREATE TABLE `alarms_v1_tb` (
                                `alarm_id` bigint(20) NOT NULL,
                                `item_id` bigint(20) NOT NULL,
                                `action` enum('DISPLAY','EMAIL') NOT NULL,
                                `trigger_spec` varchar(64) NOT NULL,
                                `trigger_is_relative` tinyint(1) NOT NULL DEFAULT 1,
                                `trigger_tzid` varchar(64) DEFAULT NULL,
                                `repeat_count` int(11) DEFAULT NULL,
                                `repeat_duration` varchar(32) DEFAULT NULL,
                                `description` text DEFAULT NULL,
                                `summary` varchar(255) DEFAULT NULL,
                                `attendee_email` varchar(320) DEFAULT NULL,
                                `extras` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras`)),
                                `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendees_v1_tb`
--

CREATE TABLE `attendees_v1_tb` (
                                   `attendee_id` bigint(20) NOT NULL,
                                   `item_id` bigint(20) NOT NULL,
                                   `email` varchar(320) NOT NULL,
                                   `cn` varchar(255) DEFAULT NULL,
                                   `role` enum('CHAIR','REQ-PARTICIPANT','OPT-PARTICIPANT','NON-PARTICIPANT') NOT NULL DEFAULT 'REQ-PARTICIPANT',
                                   `partstat` enum('NEEDS-ACTION','ACCEPTED','DECLINED','TENTATIVE','DELEGATED','IN-PROCESS','COMPLETED') NOT NULL DEFAULT 'NEEDS-ACTION',
                                   `rsvp` tinyint(1) DEFAULT NULL,
                                   `cutype` enum('INDIVIDUAL','GROUP','RESOURCE','ROOM','UNKNOWN') NOT NULL DEFAULT 'INDIVIDUAL',
                                   `member_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`member_json`)),
                                   `delegated_to_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`delegated_to_json`)),
                                   `delegated_from_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`delegated_from_json`)),
                                   `sent_by` varchar(512) DEFAULT NULL,
                                   `language` varchar(32) DEFAULT NULL,
                                   `extras` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras`)),
                                   `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                   `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `calendars_v1_tb`
--

CREATE TABLE `calendars_v1_tb` (
                                   `calendar_id` bigint(20) NOT NULL,
                                   `user_id` int(11) NOT NULL,
                                   `name` varchar(255) NOT NULL,
                                   `default_my_calendar` tinyint(1) NOT NULL,
                                   `description` text DEFAULT NULL,
                                   `cal_emoji` varchar(16) DEFAULT NULL,
                                   `color` varchar(16) DEFAULT NULL,
                                   `tzid` varchar(64) NOT NULL DEFAULT 'Etc/UTC',
                                   `category` enum('personal','holidays','birthdays','astronomy','migration','other') NOT NULL DEFAULT 'personal',
                                   `visibility` enum('private','unlisted','public') NOT NULL DEFAULT 'private',
                                   `is_readonly` tinyint(1) NOT NULL DEFAULT 0,
                                   `share_slug` varchar(64) DEFAULT NULL,
                                   `feed_token` char(32) DEFAULT NULL,
                                   `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                   `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `calendar_acl_v1_tb`
--

CREATE TABLE `calendar_acl_v1_tb` (
                                      `acl_id` bigint(20) NOT NULL,
                                      `calendar_id` bigint(20) NOT NULL,
                                      `grantee_user_id` int(11) DEFAULT NULL,
                                      `grantee_email` varchar(320) DEFAULT NULL,
                                      `role` enum('viewer','editor','admin') NOT NULL DEFAULT 'viewer',
                                      `status` enum('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
                                      `invite_token` char(36) DEFAULT NULL,
                                      `invite_expires_at` datetime DEFAULT NULL,
                                      `accepted_at` datetime DEFAULT NULL,
                                      `revoked_at` datetime DEFAULT NULL,
                                      `can_share` tinyint(1) NOT NULL DEFAULT 0,
                                      `message` text DEFAULT NULL,
                                      `created_by` int(11) DEFAULT NULL,
                                      `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                      `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `items_v1_tb`
--

CREATE TABLE `items_v1_tb` (
                               `item_id` bigint(20) NOT NULL,
                               `calendar_id` bigint(20) NOT NULL,
                               `uid` varchar(255) NOT NULL,
                               `component_type` enum('event','todo','journal') NOT NULL,
                               `summary` varchar(1024) DEFAULT NULL,
                               `description` mediumtext DEFAULT NULL,
                               `location` varchar(512) DEFAULT NULL,
                               `url` varchar(1024) DEFAULT NULL,
                               `organizer` varchar(512) DEFAULT NULL,
                               `tzid` varchar(64) NOT NULL DEFAULT 'Etc/UTC',
                               `dtstart_utc` datetime DEFAULT NULL,
                               `dtend_utc` datetime DEFAULT NULL,
                               `all_day` tinyint(1) NOT NULL DEFAULT 0,
                               `pinned` tinyint(1) NOT NULL DEFAULT 0,
                               `item_emoji` varchar(16) DEFAULT NULL,
                               `item_color` varchar(16) DEFAULT NULL,
                               `due_utc` datetime DEFAULT NULL,
                               `percent_complete` tinyint(3) UNSIGNED DEFAULT NULL,
                               `priority` tinyint(3) UNSIGNED DEFAULT NULL,
                               `status` varchar(32) DEFAULT NULL,
                               `completed_at` datetime DEFAULT NULL,
                               `classification` enum('PUBLIC','PRIVATE','CONFIDENTIAL') DEFAULT NULL,
                               `categories_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categories_json`)),
                               `latitude` decimal(9,6) DEFAULT NULL,
                               `longitude` decimal(9,6) DEFAULT NULL,
                               `extras` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras`)),
                               `raw_ics` mediumtext DEFAULT NULL,
                               `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                               `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                               `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_attachments_v1_tb`
--

CREATE TABLE `item_attachments_v1_tb` (
                                          `attachment_id` bigint(20) NOT NULL,
                                          `item_id` bigint(20) NOT NULL,
                                          `recurrence_id_utc` datetime DEFAULT NULL,
                                          `sort_order` int(11) NOT NULL DEFAULT 0,
                                          `source` enum('url','file') NOT NULL DEFAULT 'url',
                                          `url` varchar(2048) DEFAULT NULL,
                                          `file_storage` enum('local','s3','gcs','db') DEFAULT NULL,
                                          `file_path` varchar(1024) DEFAULT NULL,
                                          `filename` varchar(255) DEFAULT NULL,
                                          `mime_type` varchar(255) DEFAULT NULL,
                                          `size_bytes` bigint(20) DEFAULT NULL,
                                          `content_hash` char(64) DEFAULT NULL,
                                          `is_inline` tinyint(1) NOT NULL DEFAULT 0,
                                          `cid` varchar(255) DEFAULT NULL,
                                          `description` text DEFAULT NULL,
                                          `extras` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras`)),
                                          `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                          `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_layouts_v1_tb`
--

CREATE TABLE `item_layouts_v1_tb` (
                                      `layout_id` bigint(20) NOT NULL,
                                      `workspace_id` bigint(20) NOT NULL,
                                      `item_id` bigint(20) NOT NULL,
                                      `recurrence_id_utc` datetime DEFAULT NULL,
                                      `x_px` int(11) NOT NULL,
                                      `y_px` int(11) NOT NULL,
                                      `w_px` int(11) NOT NULL,
                                      `h_px` int(11) NOT NULL,
                                      `x_norm` decimal(6,4) DEFAULT NULL,
                                      `y_norm` decimal(6,4) DEFAULT NULL,
                                      `w_norm` decimal(6,4) DEFAULT NULL,
                                      `h_norm` decimal(6,4) DEFAULT NULL,
                                      `z_index` int(11) NOT NULL DEFAULT 0,
                                      `collapsed` tinyint(1) NOT NULL DEFAULT 0,
                                      `device_key` varchar(64) DEFAULT NULL,
                                      `viewport_w` int(11) DEFAULT NULL,
                                      `viewport_h` int(11) DEFAULT NULL,
                                      `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                      `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_remotes_v1_tb`
--

CREATE TABLE `item_remotes_v1_tb` (
                                      `item_remote_id` bigint(20) NOT NULL,
                                      `item_id` bigint(20) NOT NULL,
                                      `account_id` bigint(20) NOT NULL,
                                      `remote_item_id` varchar(512) NOT NULL,
                                      `remote_etag` varchar(128) DEFAULT NULL,
                                      `last_pushed_at` datetime DEFAULT NULL,
                                      `last_pulled_at` datetime DEFAULT NULL,
                                      `deleted_remote` tinyint(1) NOT NULL DEFAULT 0,
                                      `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                      `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `overrides_v1_tb`
--

CREATE TABLE `overrides_v1_tb` (
                                   `override_id` bigint(20) NOT NULL,
                                   `parent_item_id` bigint(20) NOT NULL,
                                   `recurrence_id_utc` datetime NOT NULL,
                                   `rid_is_date` tinyint(1) NOT NULL DEFAULT 0,
                                   `rid_tzid` varchar(64) DEFAULT NULL,
                                   `range_this_future` tinyint(1) NOT NULL DEFAULT 0,
                                   `patched_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`patched_fields`)),
                                   `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                   `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `provider_webhooks_v1_tb`
--

CREATE TABLE `provider_webhooks_v1_tb` (
                                           `webhook_id` bigint(20) NOT NULL,
                                           `account_id` bigint(20) NOT NULL,
                                           `mapping_id` bigint(20) DEFAULT NULL,
                                           `provider` enum('google','microsoft') NOT NULL,
                                           `topic` varchar(512) DEFAULT NULL,
                                           `remote_calendar_id` varchar(512) DEFAULT NULL,
                                           `channel_id` varchar(255) DEFAULT NULL,
                                           `resource_id` varchar(255) DEFAULT NULL,
                                           `subscription_id` varchar(255) DEFAULT NULL,
                                           `notification_uri` varchar(1024) DEFAULT NULL,
                                           `client_state` varchar(255) DEFAULT NULL,
                                           `expires_at` datetime DEFAULT NULL,
                                           `last_renewal_at` datetime DEFAULT NULL,
                                           `last_event_received_at` datetime DEFAULT NULL,
                                           `status` enum('active','renewing','expired','revoked','error') NOT NULL DEFAULT 'active',
                                           `last_status_code` int(11) DEFAULT NULL,
                                           `last_error` text DEFAULT NULL,
                                           `extras` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras`)),
                                           `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                           `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recurrences_v1_tb`
--

CREATE TABLE `recurrences_v1_tb` (
                                     `recurrence_id` bigint(20) NOT NULL,
                                     `item_id` bigint(20) NOT NULL,
                                     `rrule_text` text DEFAULT NULL,
                                     `rdate_text` text DEFAULT NULL,
                                     `exdate_text` text DEFAULT NULL,
                                     `extras` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras`)),
                                     `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                     `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_accounts_v1_tb`
--

CREATE TABLE `sync_accounts_v1_tb` (
                                       `account_id` bigint(20) NOT NULL,
                                       `user_id` int(11) NOT NULL,
                                       `provider` enum('caldav','google','microsoft') NOT NULL,
                                       `display_name` varchar(255) DEFAULT NULL,
                                       `external_principal` varchar(320) DEFAULT NULL,
                                       `base_url` text DEFAULT NULL,
                                       `username` varchar(255) DEFAULT NULL,
                                       `oauth_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`oauth_json`)),
                                       `scopes` varchar(512) DEFAULT NULL,
                                       `status` enum('active','disabled','error','revoked') NOT NULL DEFAULT 'active',
                                       `last_auth_refresh` datetime DEFAULT NULL,
                                       `last_sync_started_at` datetime DEFAULT NULL,
                                       `last_sync_finished_at` datetime DEFAULT NULL,
                                       `last_error` text DEFAULT NULL,
                                       `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                       `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_events_v1_tb`
--

CREATE TABLE `sync_events_v1_tb` (
                                     `event_id` bigint(20) NOT NULL,
                                     `ts` datetime NOT NULL DEFAULT current_timestamp(),
                                     `account_id` bigint(20) DEFAULT NULL,
                                     `mapping_id` bigint(20) DEFAULT NULL,
                                     `calendar_id` bigint(20) DEFAULT NULL,
                                     `item_id` bigint(20) DEFAULT NULL,
                                     `item_remote_id` bigint(20) DEFAULT NULL,
                                     `provider` enum('caldav','google','microsoft') DEFAULT NULL,
                                     `direction` enum('pull','push') NOT NULL,
                                     `source` enum('webhook','poll','manual','reconcile') NOT NULL DEFAULT 'poll',
                                     `action` enum('create','update','delete','skip','conflict','noop') NOT NULL,
                                     `component` enum('event','todo','journal') DEFAULT NULL,
                                     `status` enum('success','error') NOT NULL,
                                     `http_status` int(11) DEFAULT NULL,
                                     `error_code` varchar(128) DEFAULT NULL,
                                     `error_message` text DEFAULT NULL,
                                     `started_at` datetime DEFAULT NULL,
                                     `finished_at` datetime DEFAULT NULL,
                                     `duration_ms` int(11) DEFAULT NULL,
                                     `batch_id` char(36) DEFAULT NULL,
                                     `uid` varchar(255) DEFAULT NULL,
                                     `remote_item_id` varchar(512) DEFAULT NULL,
                                     `request_etag` varchar(128) DEFAULT NULL,
                                     `response_etag` varchar(128) DEFAULT NULL,
                                     `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_mappings_v1_tb`
--

CREATE TABLE `sync_mappings_v1_tb` (
                                       `mapping_id` bigint(20) NOT NULL,
                                       `account_id` bigint(20) NOT NULL,
                                       `calendar_id` bigint(20) NOT NULL,
                                       `remote_calendar_id` varchar(512) NOT NULL,
                                       `remote_calendar_name` varchar(255) DEFAULT NULL,
                                       `remote_timezone` varchar(64) DEFAULT NULL,
                                       `sync_token` text DEFAULT NULL,
                                       `collection_etag` varchar(128) DEFAULT NULL,
                                       `active` tinyint(1) NOT NULL DEFAULT 1,
                                       `last_full_sync_at` datetime DEFAULT NULL,
                                       `last_delta_sync_at` datetime DEFAULT NULL,
                                       `last_error` text DEFAULT NULL,
                                       `created_at` datetime NOT NULL DEFAULT current_timestamp(),
                                       `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users_tb`
--

CREATE TABLE `users_tb` (
                            `open_id` varchar(255) DEFAULT NULL,
                            `buwana_id` int(11) NOT NULL,
                            `first_name` varchar(255) NOT NULL,
                            `last_name` varchar(255) DEFAULT NULL,
                            `full_name` varchar(255) DEFAULT NULL,
                            `username` varchar(100) DEFAULT NULL,
                            `email` varchar(254) NOT NULL,
                            `account_status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active',
                            `created_at` datetime DEFAULT NULL,
                            `last_login` datetime DEFAULT NULL,
                            `role` varchar(255) DEFAULT 'user',
                            `terms_of_service` tinyint(1) NOT NULL DEFAULT 0,
                            `notes` text DEFAULT NULL,
                            `flagged` tinyint(1) NOT NULL DEFAULT 0,
                            `profile_pic` varchar(255) NOT NULL DEFAULT 'null',
                            `country_id` int(11) DEFAULT NULL,
                            `watershed_id` int(11) DEFAULT NULL,
                            `language_id` varchar(11) NOT NULL,
                            `earthen_newsletter_join` tinyint(1) DEFAULT 1,
                            `login_count` smallint(6) DEFAULT 0,
                            `birth_date` date NOT NULL,
                            `deleteable` tinyint(1) DEFAULT 0,
                            `continent_code` varchar(5) DEFAULT NULL,
                            `earthling_emoji` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                            `location_full` varchar(254) DEFAULT NULL,
                            `location_watershed` varchar(254) NOT NULL,
                            `location_lat` decimal(10,8) DEFAULT NULL,
                            `location_long` decimal(11,8) DEFAULT NULL,
                            `community_id` int(11) DEFAULT NULL,
                            `time_zone` varchar(50) DEFAULT NULL,
                            `tour_taken` tinyint(1) DEFAULT 0,
                            `last_sync_ts` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users_tb`
--

INSERT INTO `users_tb` (`open_id`, `buwana_id`, `first_name`, `last_name`, `full_name`, `username`, `email`, `account_status`, `created_at`, `last_login`, `role`, `terms_of_service`, `notes`, `flagged`, `profile_pic`, `country_id`, `watershed_id`, `language_id`, `earthen_newsletter_join`, `login_count`, `birth_date`, `deleteable`, `continent_code`, `earthling_emoji`, `location_full`, `location_watershed`, `location_lat`, `location_long`, `community_id`, `time_zone`, `tour_taken`, `last_sync_ts`) VALUES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ('buwana_1', 1, 'Earthcal', 'Admin', 'EarthCal Admin', '', 'admin@earthcal.app', 'active', '2024-12-27 12:42:01', '2024-12-27 12:42:01', 'admin', 1, 'Manually created', 0, 'null', 1, 0, 'id', 1, 1, '0000-00-00', 1, 'AS', NULL, 'Jogja, Indonesia', 'Sungai Winongo', -7.88774540, 110.32741390, 21, NULL, 0, '2025-01-15 14:44:12'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ('buwana_150', 150, 'Russell', 'Maier', 'Russell Maier', '', 'russmaier@gmail.com', 'active', '2024-12-27 12:42:01', '2024-12-27 12:42:01', 'user', 1, 'account activate, no sync', 0, 'null', 1, 0, 'id', 1, 1, '0000-00-00', 1, 'AS', NULL, 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Winongo', -7.88774540, 110.32741390, 21, NULL, 0, '2025-01-15 14:44:12'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 201, 'Iluh eka', 'Lindawati', 'Iluh eka Lindawati', NULL, 'iluhekalindawati@gmail.com', 'active', '2025-07-14 02:22:19', NULL, 'user', 1, 'First experimental activations', 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦋', 'Batam, Riau Islands, Sumatra, Indonesia', 'no watershed', 1.10308150, 104.03836960, 3031, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 276, 'Lucie', 'Mann', 'Lucie Mann', NULL, 'ukecobricks@gmail.com', 'active', '2025-08-11 17:34:23', NULL, 'user', 1, 'First experimental activations First registered on gobrik at 2025-06-08 06:38:55.', 0, '0', 175, NULL, '0', 1, 0, '0000-00-00', 0, 'EU', '🪱', 'Langley, New Forest, Hampshire, England, SO45 1SB, United Kingdom', 'Dark Water', 50.80828480, -1.36798730, 46, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 307, 'Paula', 'Apollonia', 'Paula Apollonia', NULL, 'paula.guedemann@gmail.com', 'active', '2025-09-29 06:40:19', NULL, 'user', 1, 'First experimental activations First registered on gobrik at 2025-05-19 13:58:18.', 0, '0', NULL, NULL, '0', 1, 0, '0000-00-00', 0, NULL, '🌏', 'Essaouira, Pachalik d\'Essaouira باشوية الصويرة, Essaouira Province, Marrakech-Safi, Marokko', '', 31.51182810, -9.76209030, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_906', 906, 'Hip', '', 'Hip', '', 'hiphip@test.com', 'active', '2025-01-14 18:19:33', '2025-01-14 18:19:33', 'user', 1, 'account activate, no sync', 0, 'null', 4, 0, '', 1, 1, '0000-00-00', 1, 'NA', NULL, 'Pacific Palisades, Los Angeles, Los Angeles County, California, 90402, United States', 'no watershed', 34.04806430, -118.52647060, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1136', 1136, 'Calendar', '', 'Calendar', '', 'calendar@test.com', 'active', '2025-02-07 15:55:16', '2025-02-07 15:55:16', 'user', 1, 'account activate, no sync', 0, 'null', 1, 0, '', 1, 1, '0000-00-00', 1, 'AS', NULL, 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Winongo', -7.89145945, 110.33614768, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1306', 1306, 'seiko@test.com', '', 'seiko@test.com', '', 'creambath@test.com', 'active', '2025-03-17 13:46:45', '2025-03-17 13:46:45', 'user', 1, 'account activate, no sync', 0, 'null', 1, 0, '', 1, 1, '0000-00-00', 1, 'AS', NULL, 'Yogyakarta, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Bedog', -7.80119980, 110.36466080, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1334', 1334, 'Mel', 'Tebbutt-Bushell', 'Mel Tebbutt-Bushell', '', 'melbushell@yahoo.co.uk', 'active', '2025-03-25 10:21:51', '2025-03-25 10:21:51', 'user', 1, 'account activate, no sync', 0, 'null', 175, 0, '', 1, 1, '0000-00-00', 1, 'EU', NULL, 'Bideford, Torridge District, Devon, England, United Kingdom', 'River Torridge', 51.01814480, -4.20642230, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1940', 1940, 'First', NULL, 'First', NULL, 'first@test.com', 'active', '2025-05-09 08:18:09', NULL, 'user', 1, NULL, 0, '0', NULL, NULL, '0', 1, 0, '0000-00-00', 0, NULL, '', 'Swindon, England, United Kingdom', 'River Ray', 51.58758220, -1.76183160, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1941', 1941, 'Rusty', NULL, 'Rusty', NULL, 'rusty@wert.com', 'active', '2025-05-09 08:35:45', NULL, 'user', 1, NULL, 0, '0', NULL, NULL, '0', 1, 0, '0000-00-00', 0, NULL, '🦊', 'Bantul ꦧꦤ꧀ꦠꦸꦭ꧀, Bantul Regency, Special Region of Yogyakarta, Jawa, Indonesia', 'Kali Bedog', -7.88774540, 110.32741390, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1946', 1946, 'Shine', NULL, 'Shine', NULL, 'shined@test.com', 'active', '2025-05-10 06:05:52', NULL, 'user', 1, NULL, 0, '0', NULL, NULL, '0', 1, 0, '0000-00-00', 0, NULL, '🐶', 'Beaconhill, Cramlington, Northumberland, North East, England, United Kingdom', 'River Blyth', 55.08525840, -1.60551050, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1949', 1949, 'Water', NULL, 'Water', NULL, 'test@sdfsds.com', 'active', '2025-05-11 16:23:43', NULL, 'user', 1, NULL, 0, '0', NULL, NULL, '0', 1, 0, '0000-00-00', 0, NULL, '', 'Salmon, Lemhi County, Idaho, 83467, United States', 'Salmon River', 45.17592130, -113.89577300, 14, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1952', 1952, 'Bumi', NULL, 'Bumi', NULL, 'bumi@test.com', 'active', '2025-05-11 07:42:34', NULL, 'user', 1, NULL, 0, '0', NULL, NULL, '0', 1, 0, '0000-00-00', 0, NULL, '🐯', 'Cantón de Buenos Aires, Puntarenas Province, Costa Rica', 'Río Mosca', 9.08001920, -83.22925070, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1954', 1954, 'Swanky', NULL, 'Swanky', NULL, 'swanky@test.com', 'active', '2025-05-11 17:22:49', NULL, 'user', 1, NULL, 0, '0', 164, NULL, '0', 1, 0, '0000-00-00', 0, 'EU', '0', 'Hot, Kastrat, Bashkia Malësi e Madhe, Shkodër County, 4306, Albania', 'Cijevna', 42.36408330, 19.44583180, 2995, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1957', 1957, 'Moist', NULL, 'Moist', NULL, 'moist@test.com', 'active', '2025-05-12 05:39:15', NULL, 'user', 1, NULL, 0, '0', 11, NULL, '0', 1, 0, '0000-00-00', 0, 'NA', '0', 'Moncton, Moncton Parish, Westmorland County, New Brunswick, Canada', 'Petitcodiac River / Rivière Petitcodiac', 46.09856790, -64.80042650, 949, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1959', 1959, 'Marte', NULL, 'Marte', NULL, 'marte@test.com', 'active', '2025-05-12 08:11:15', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦦', 'Bantul Regency, Special Region of Yogyakarta, Jawa, Indonesia', 'Sungai Code', -7.89825440, 110.38555340, NULL, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1964', 1964, 'Rusty', NULL, 'Rusty', NULL, 'rusty@test23.com', 'active', '2025-05-13 02:00:39', NULL, 'user', 1, NULL, 0, '0', 11, NULL, '0', 1, 0, '0000-00-00', 0, 'NA', '🐸', 'Ottawa, Eastern Ontario, Ontario, Canada', 'Décharge du Lac Leamy', 45.42087770, -75.69011060, 2998, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1970', 1970, 'Gula', NULL, 'Gula', NULL, 'gula@test.com', 'active', '2025-05-14 07:06:58', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '', 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Kali Bedog', -7.88774540, 110.32741390, 3000, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1971', 1971, 'Point', NULL, 'Point', NULL, 'point@test.com', 'active', '2025-05-14 07:35:34', NULL, 'user', 1, NULL, 0, '0', 82, NULL, '0', 1, 0, '0000-00-00', 0, 'EU', '🐸', 'Chimay, Thuin, Hainaut, Wallonia, Belgium', 'Eau Blanche', 50.03564580, 4.32125730, 2995, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1976', 1976, 'Sportea', NULL, 'Sportea', NULL, 'sportea@test.com', 'active', '2025-05-15 04:17:18', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐯', 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Winongo', -7.88533460, 110.32972730, 2997, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1984', 1984, 'Grand', NULL, 'Grand', NULL, 'grand@test.com', 'active', '2025-05-16 03:33:07', NULL, 'user', 1, NULL, 0, '0', 11, NULL, '0', 1, 0, '0000-00-00', 0, 'NA', '', 'Daajing Giids, North Coast Regional District, British Columbia, V0T 1S0, Canada', 'no watershed', 53.25478800, -132.10273000, 2997, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1986', 1986, 'Rusty', NULL, 'Rusty', NULL, 'rusty16@test.com', 'active', '2025-05-16 11:14:15', NULL, 'user', 1, NULL, 0, '0', 11, NULL, '0', 1, 0, '0000-00-00', 0, 'NA', '🪺', 'Daajing Giids, North Coast Regional District, British Columbia, V0T 1S0, Canada', 'no watershed', 53.25478800, -132.10273000, 27, NULL, 0, '0000-00-00 00:00:00'),
('buwana_1994', 1994, 'Kleen', 'Hore', 'Kleen Hore', NULL, 'kleen@test.com', 'active', '2025-05-17 10:13:01', NULL, 'user', 1, 'Step 3: User\'s email confirmed. First registered on gobrik at 2025-05-17 06:50:08.', 0, '0', 175, NULL, '0', 1, 0, '0000-00-00', 0, 'EU', '🐸', 'Skye, Highland, Scotland, United Kingdom', 'River Snizort', 57.36300790, -6.30217370, 3001, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ('buwana_1997', 1997, 'Kalbe', NULL, 'Kalbe', NULL, 'kalbe@test.com', 'active', '2025-05-17 11:43:12', NULL, 'user', 1, NULL, 0, '0', 4, NULL, '0', 1, 0, '0000-00-00', 0, 'NA', '🐯', 'Ottawa County, Ohio, United States', 'Toussaint River', 41.54213750, -83.21334200, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ('buwana_2002', 2002, 'Umy', NULL, 'Umy', NULL, 'umy@test.com', 'active', '2025-05-18 04:52:15', NULL, 'user', 1, NULL, 0, '0', 77, NULL, '0', 1, 0, '0000-00-00', 0, 'NA', '🐡', 'Cantón de Escazú, San Jose Province, Costa Rica', 'Río Alajuelita', 9.91603250, -84.14098440, 33, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ('buwana_2008', 2008, 'Oriza', NULL, 'Oriza', NULL, 'oriza.a@mail.ugm.ac.id', 'active', '2025-05-19 12:29:10', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🍀', 'Bangunjiwo, Kasihan, Bantul Regency, Special Region of Yogyakarta, Java, 55184, Indonesia', 'Kali Kontheng', -7.84263980, 110.31395820, 3003, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ('buwana_2193', 2193, 'Seeme', NULL, 'Seeme', NULL, 'seeme@test.com', 'active', '2025-06-14 08:59:02', NULL, 'user', 1, NULL, 0, '0', 62, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦥', 'Hapoel TelAviv, Zvulun Regional Council, Haifa Subdistrict, Haifa District, 3658800, Israel', 'נחל קישון', 32.72149490, 35.10811260, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ('buwana_2437', 2437, 'Iha', NULL, 'Iha', NULL, 'iha@test.com', 'active', '2025-06-27 01:51:28', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐶', 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Kali Bedog', -7.88774540, 110.32741390, 21, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2438, 'Chimay', NULL, 'Chimay', NULL, 'chimay2@test.com', 'active', '2025-06-27 04:07:48', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐱', 'Bumi Langit, Jalan Imogiri - Dlingo, Wukirsari, Imogiri, Bantul Regency, Special Region of Yogyakarta, Java, 55782, Indonesia', 'Sungai Code', -7.92634160, 110.41027560, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2439, 'Coca', NULL, 'Coca', NULL, 'coca@test.com', 'active', '2025-06-27 04:31:02', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐸', 'Bumi Langit, Jalan Imogiri - Dlingo, Wukirsari, Imogiri, Bantul Regency, Special Region of Yogyakarta, Java, 55782, Indonesia', 'Sungai Oya', -7.92634160, 110.41027560, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2440, 'Wenger', NULL, 'Wenger', NULL, 'wenger@test.com', 'active', '2025-06-27 04:57:15', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦍', 'Bumi Langit, Jalan Imogiri - Dlingo, Wukirsari, Imogiri, Bantul Regency, Special Region of Yogyakarta, Java, 55782, Indonesia', 'Kali Opak', -7.92634160, 110.41027560, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2441, 'Alka', NULL, 'Alka', NULL, 'alka@test.com', 'active', '2025-06-27 05:43:33', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🧑‍🚀', 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Winongo', -7.88774540, 110.32741390, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2444, 'Wana', NULL, 'Wana', NULL, 'wana@test.com', 'active', '2025-06-28 03:05:11', NULL, 'user', 1, NULL, 0, '0', 107, NULL, '0', 1, 0, '0000-00-00', 0, 'EU', '🦧', 'Isle of Man', 'River Glass', 54.19368050, -4.55911480, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2547, 'Brittany', 'W', 'Brittany W', NULL, 'amrosiaaldaine@hotmail.com', 'active', '2025-07-18 19:38:42', NULL, 'user', 1, 'Step 3: User\'s email confirmed. First registered on gobrik at 2025-07-08 01:26:20.', 0, '0', 4, NULL, '0', 1, 0, '0000-00-00', 0, 'NA', '🦇', 'East Bayview Boulevard, Northside, Norfolk, Virginia, 23503, United States', 'Lafayette River', 36.93319330, -76.25069830, NULL, NULL, 0, '0000-00-00 00:00:00'),
(NULL, 2642, 'Yolanda', NULL, 'Yolanda', NULL, 'komangyolanda05@gmail.com', 'active', '2025-07-14 01:47:28', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐬', 'Batam, Riau Islands, Sumatra, Indonesia', 'watershed unknown', 1.10308150, 104.03836960, 3031, NULL, 0, '0000-00-00 00:00:00'),
(NULL, 2668, 'Handker', NULL, 'Handker', NULL, 'handker@test.com', 'active', '2025-07-15 08:04:49', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦁', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Tukad Pakerisan', -8.50689770, 115.26229310, 21, NULL, 0, '0000-00-00 00:00:00'),
(NULL, 2680, 'Pontus', NULL, 'Pontus', NULL, 'cjpontus@gmail.com', 'active', '2025-07-16 02:03:48', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐖', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Ayung', -8.50689770, 115.26229310, NULL, NULL, 0, '0000-00-00 00:00:00'),
(NULL, 2681, 'Villa', NULL, 'Villa', NULL, 'villa@test.com', 'active', '2025-07-16 04:54:38', NULL, 'user', 1, 'Step 3: User\'s email confirmed. First registered on gobrik at 2025-07-16 04:52:50.', 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐱', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Ayung', -8.50689770, 115.26229310, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2682, 'Tweet@test.com', NULL, 'Tweet@test.com', NULL, 'tweet@test.com', 'active', '2025-07-16 05:09:49', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐻', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Tukad Pakerisan', -8.50689770, 115.26229310, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2689, 'Mana@test.com', NULL, 'Mana@test.com', NULL, 'mana@test.com', 'active', '2025-07-17 03:53:40', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐘', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Tukad Petanu', -8.50689770, 115.26229310, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2691, 'Cricket@test.com', NULL, 'Cricket@test.com', NULL, 'crickets@gmail.com', 'active', '2025-07-17 15:15:53', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐯', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Tukad Pakerisan', -8.50689770, 115.26229310, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2692, 'Vera', NULL, 'Vera', NULL, 'vera@test.com', 'active', '2025-07-17 15:50:59', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦨', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Tukad Pakerisan', -8.50689770, 115.26229310, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2701, 'Wenger@test.com', NULL, 'Wenger@test.com', NULL, 'wenger2@test.com', 'active', '2025-07-18 01:03:57', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦇', 'Ubud, Ubud District, Gianyar, Bali, Lesser Sunda Islands, 80571, Indonesia', 'Ayung', -8.50689770, 115.26229310, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2797, 'Situbondo', NULL, 'Situbondo', NULL, 'situ@test.com', 'active', '2025-07-22 07:27:37', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦥', 'Situbondo, East Java, Java, Indonesia', 'Sungai Sampean', -7.70678430, 114.00541420, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 2891, 'Kediri', NULL, 'Kediri', NULL, 'kediri@test.com', 'active', '2025-07-26 14:08:49', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐸', 'Kediri City, East Java, Java, Indonesia', 'Kali Kalasan', -7.81110570, 112.00460510, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3065, 'James', NULL, 'James', NULL, 'soundofnuma@gmail.com', 'active', '2025-08-03 19:27:55', NULL, 'user', 1, NULL, 0, '0', 15, NULL, '0', 1, 0, '0000-00-00', 0, 'OC', '🪴', 'City of Brisbane, Queensland, Australia', 'Brisbane River', -27.46896230, 153.02350090, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3253, 'Delaware', NULL, 'Delaware', NULL, 'delaware@test.com', 'active', '2025-08-24 10:01:35', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦌', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Winongo', -7.89825430, 110.38555340, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3258, 'Didier', NULL, 'Didier', NULL, 'didier.pierre321@gmail.com', 'active', '2025-08-24 15:43:27', NULL, 'user', 1, NULL, 0, '0', 12, NULL, '0', 1, 0, '0000-00-00', 0, 'EU', '🦁', 'Paris, Île-de-France, France métropolitaine, France', 'La Seine', 48.85349510, 2.34839150, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3286, 'Sultan', NULL, 'Sultan', NULL, 'sultan@test.com', 'active', '2025-08-27 05:21:35', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐢', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Code', -7.89825430, 110.38555340, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3292, 'Wenger', NULL, 'Wenger', NULL, 'wenger4@test.com', 'active', '2025-08-27 11:37:05', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐵', 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Kali Winongo', -7.88774540, 110.32741390, 21, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3293, 'Wenger', NULL, 'Wenger', NULL, 'wenger6@test.com', 'active', '2025-08-27 11:34:59', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦁', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Code', -7.89825430, 110.38555340, 21, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3301, 'Cement', NULL, 'Cement', NULL, 'cement@test.com', 'active', '2025-08-27 14:02:22', NULL, 'user', 1, NULL, 0, '0', 3, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐮', 'Sagada, Dao-angan, Sagada, Mountain Province, Cordillera Administrative Region, 2619, Philippines', 'Chico River', 17.08520540, 120.89898060, 485, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3302, 'Offering', NULL, 'Offering', NULL, 'offering@test.com', 'active', '2025-08-27 14:05:13', NULL, 'user', 1, NULL, 0, '0', 33, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦥', 'Saga Prefecture, Japan', '古野川', 33.21854080, 130.12965850, 3001, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3308, 'Sneeze', NULL, 'Sneeze', NULL, 'sneeze@test.com', 'active', '2025-08-28 09:38:45', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦡', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai WInongo', -7.89825430, 110.38555340, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3407, 'Whadi', NULL, 'Whadi', NULL, 'whadi@test.com', 'active', '2025-09-04 12:28:54', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐑', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai WInongo', -7.89825430, 110.38555340, 949, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3457, 'Gula', NULL, 'Gula', NULL, 'gula2@test.com', 'active', '2025-09-08 04:13:12', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦁', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Winongo', -7.89825430, 110.38555340, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3459, 'Wedang', NULL, 'Wedang', NULL, 'wedang@test.com', 'active', '2025-09-08 08:10:42', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🦍', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Code', -7.89825430, 110.38555340, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3460, 'Walked', NULL, 'Walked', NULL, 'walked@test.com', 'active', '2025-09-08 09:32:12', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐵', 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Winongo', -7.88774540, 110.32741390, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3576, 'Sunshine', NULL, 'Sunshine', NULL, 'sunshine@test.com', 'active', '2025-09-11 03:30:03', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐯', 'Bantul, Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai WInongo', -7.88774540, 110.32741390, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3712, 'Rust2', NULL, 'Rust2', NULL, 'rust2@test.com', 'active', '2025-09-11 05:31:26', NULL, 'user', 1, NULL, 0, '0', 16, NULL, '0', 1, 0, '0000-00-00', 0, 'EU', '🐱', 'Bant, Wilhelmshaven, Lower Saxony, Germany', 'Jade', 53.52036720, 8.10066770, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3793, 'Chip', NULL, 'Chip', NULL, 'chip@test.com', 'active', '2025-09-11 08:36:22', NULL, 'user', 1, NULL, 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐮', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'watershed unknown', -7.89825430, 110.38555340, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 3920, 'Alexi', NULL, 'Alexi', NULL, 'alexi@helligar.com', 'active', '2025-09-21 17:44:58', NULL, 'user', 0, 'Step 1 complete: Buwana beta testing First registered on gobrik at 2025-09-21 17:44:14.', 0, '0', NULL, NULL, '0', 1, 0, '0000-00-00', 0, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, 0, '0000-00-00 00:00:00'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (NULL, 4212, 'Bora', NULL, 'Bora', NULL, 'bora@test.com', 'active', '2025-10-01 10:20:42', NULL, 'user', 1, 'Step 3: User\'s email confirmed. First registered on gobrik at 2025-10-01 10:19:33.', 0, '0', 1, NULL, '0', 1, 0, '0000-00-00', 0, 'AS', '🐧', 'Bantul Regency, Special Region of Yogyakarta, Java, Indonesia', 'Sungai Code', -7.89825430, 110.38555340, 121, NULL, 0, '0000-00-00 00:00:00');

--
-- Triggers `users_tb`
--
DELIMITER $$
CREATE TRIGGER `users_email_norm_bi` BEFORE INSERT ON `users_tb` FOR EACH ROW BEGIN
  IF NEW.email IS NOT NULL THEN
    SET NEW.email = LOWER(TRIM(NEW.email));
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `users_email_norm_bu` BEFORE UPDATE ON `users_tb` FOR EACH ROW BEGIN
  IF NEW.email IS NOT NULL THEN
    SET NEW.email = LOWER(TRIM(NEW.email));
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `webcal_subscriptions_v1_tb`
--

CREATE TABLE `webcal_subscriptions_v1_tb` (
  `subscription_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `calendar_id` bigint(20) NOT NULL,
  `url` varchar(1024) NOT NULL,
  `url_hash` char(64) NOT NULL,
  `feed_title` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `import_mode` enum('merge','replace') NOT NULL DEFAULT 'merge',
  `import_scope` enum('all','events','todos','journals') NOT NULL DEFAULT 'all',
  `refresh_interval_minutes` int(11) NOT NULL DEFAULT 360,
  `next_fetch_at` datetime DEFAULT NULL,
  `last_fetch_at` datetime DEFAULT NULL,
  `last_http_status` int(11) DEFAULT NULL,
  `last_etag` varchar(255) DEFAULT NULL,
  `last_modified_header` varchar(64) DEFAULT NULL,
  `bytes_fetched` int(11) DEFAULT NULL,
  `items_imported` int(11) DEFAULT NULL,
  `last_error` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workspaces_v1_tb`
--

CREATE TABLE `workspaces_v1_tb` (
  `workspace_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('day','week','month','map','custom') NOT NULL,
  `date_from` date DEFAULT NULL,
  `date_to` date DEFAULT NULL,
  `tzid` varchar(64) NOT NULL DEFAULT 'Etc/UTC',
  `viewport_w` int(11) DEFAULT NULL,
  `viewport_h` int(11) DEFAULT NULL,
  `zoom` float NOT NULL DEFAULT 1,
  `device_key` varchar(64) DEFAULT NULL,
  `settings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `day_key` date GENERATED ALWAYS AS (case when `type` = 'day' then `date_from` else NULL end) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alarms_v1_tb`
--
ALTER TABLE `alarms_v1_tb`
  ADD PRIMARY KEY (`alarm_id`),
  ADD KEY `idx_alarms_item` (`item_id`);

--
-- Indexes for table `attendees_v1_tb`
--
ALTER TABLE `attendees_v1_tb`
  ADD PRIMARY KEY (`attendee_id`),
  ADD UNIQUE KEY `uk_item_email` (`item_id`,`email`),
  ADD KEY `idx_attendees_item` (`item_id`);

--
-- Indexes for table `calendars_v1_tb`
--
ALTER TABLE `calendars_v1_tb`
  ADD PRIMARY KEY (`calendar_id`),
  ADD UNIQUE KEY `uk_user_name` (`user_id`,`name`),
  ADD UNIQUE KEY `share_slug` (`share_slug`),
  ADD UNIQUE KEY `feed_token` (`feed_token`),
  ADD KEY `idx_user_visibility_category` (`user_id`,`visibility`,`category`);

--
-- Indexes for table `calendar_acl_v1_tb`
--
ALTER TABLE `calendar_acl_v1_tb`
  ADD PRIMARY KEY (`acl_id`),
  ADD UNIQUE KEY `uk_calendar_user` (`calendar_id`,`grantee_user_id`),
  ADD UNIQUE KEY `uk_calendar_email` (`calendar_id`,`grantee_email`),
  ADD KEY `idx_calendar_role` (`calendar_id`,`role`),
  ADD KEY `idx_grantee_user` (`grantee_user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_invite_token` (`invite_token`),
  ADD KEY `fk_acl_created_by` (`created_by`);


--
-- Indexes for table `items_v1_tb`
--
ALTER TABLE `items_v1_tb`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `uk_calendar_uid` (`calendar_id`,`uid`),
  ADD KEY `idx_items_cal_start` (`calendar_id`,`dtstart_utc`),
  ADD KEY `idx_items_type` (`component_type`),
  ADD KEY `idx_items_pinned` (`calendar_id`,`pinned`,`dtstart_utc`);

--
-- Indexes for table `item_attachments_v1_tb`
--
ALTER TABLE `item_attachments_v1_tb`
  ADD PRIMARY KEY (`attachment_id`),
  ADD UNIQUE KEY `uk_item_occurrence_url` (`item_id`, `recurrence_id_utc`, `url`(191)),
  ADD KEY `idx_item_time` (`item_id`,`created_at`),
  ADD KEY `idx_item_occurrence` (`item_id`,`recurrence_id_utc`);

--
-- Indexes for table `item_layouts_v1_tb`
--
ALTER TABLE `item_layouts_v1_tb`
  ADD PRIMARY KEY (`layout_id`),
  ADD UNIQUE KEY `uk_layout` (`workspace_id`,`item_id`,`recurrence_id_utc`),
  ADD KEY `idx_layout_workspace` (`workspace_id`),
  ADD KEY `idx_layout_item` (`item_id`);

--
-- Indexes for table `item_remotes_v1_tb`
--
ALTER TABLE `item_remotes_v1_tb`
  ADD PRIMARY KEY (`item_remote_id`),
  ADD UNIQUE KEY `uk_remote` (`account_id`,`remote_item_id`),
  ADD KEY `idx_item_account` (`item_id`,`account_id`);

--
-- Indexes for table `overrides_v1_tb`
--
ALTER TABLE `overrides_v1_tb`
  ADD PRIMARY KEY (`override_id`),
  ADD UNIQUE KEY `uk_override_instance` (`parent_item_id`,`recurrence_id_utc`),
  ADD KEY `idx_overrides_parent_time` (`parent_item_id`,`recurrence_id_utc`);

--
-- Indexes for table `provider_webhooks_v1_tb`
--
ALTER TABLE `provider_webhooks_v1_tb`
  ADD PRIMARY KEY (`webhook_id`),
  ADD KEY `idx_webhooks_account` (`account_id`,`status`),
  ADD KEY `idx_webhooks_expires` (`expires_at`),
  ADD KEY `idx_webhooks_mapping` (`mapping_id`),
  ADD KEY `idx_webhooks_subscription` (`subscription_id`),
  ADD KEY `idx_webhooks_channel` (`channel_id`);

--
-- Indexes for table `recurrences_v1_tb`
--
ALTER TABLE `recurrences_v1_tb`
  ADD PRIMARY KEY (`recurrence_id`),
  ADD UNIQUE KEY `uk_recurrence_item` (`item_id`);

--
-- Indexes for table `sync_accounts_v1_tb`
--
ALTER TABLE `sync_accounts_v1_tb`
  ADD PRIMARY KEY (`account_id`),
  ADD UNIQUE KEY `uk_user_provider_principal` (`user_id`,`provider`,`external_principal`(191)),
  ADD KEY `idx_accounts_user_provider_status` (`user_id`,`provider`,`status`);


--
-- Indexes for table `sync_events_v1_tb`
--
ALTER TABLE `sync_events_v1_tb`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `idx_ts` (`ts`),
  ADD KEY `idx_account_time` (`account_id`,`ts`),
  ADD KEY `idx_mapping_time` (`mapping_id`,`ts`),
  ADD KEY `idx_calendar_time` (`calendar_id`,`ts`),
  ADD KEY `idx_item_time` (`item_id`,`ts`),
  ADD KEY `idx_status_time` (`status`,`ts`),
  ADD KEY `idx_batch` (`batch_id`),
  ADD KEY `idx_remote` (`provider`,`remote_item_id`(191)),
  ADD KEY `fk_sync_events_item_remote` (`item_remote_id`);

--
-- Indexes for table `sync_mappings_v1_tb`
--
ALTER TABLE `sync_mappings_v1_tb`
  ADD PRIMARY KEY (`mapping_id`),
  ADD UNIQUE KEY `uk_account_remote_cal` (`account_id`,`remote_calendar_id`(191)),
  ADD KEY `idx_mappings_calendar_account` (`calendar_id`,`account_id`),
  ADD KEY `idx_mappings_active` (`active`);

--
-- Indexes for table `users_tb`
--
ALTER TABLE `users_tb`
  ADD PRIMARY KEY (`buwana_id`),
  ADD UNIQUE KEY `uniq_users_email` (`email`),
  ADD UNIQUE KEY `open_id` (`open_id`);

--
-- Indexes for table `webcal_subscriptions_v1_tb`
--
ALTER TABLE `webcal_subscriptions_v1_tb`
  ADD PRIMARY KEY (`subscription_id`),
  ADD UNIQUE KEY `uk_user_urlhash` (`user_id`,`url_hash`),
  ADD KEY `idx_user_active` (`user_id`,`is_active`),
  ADD KEY `idx_next_fetch` (`next_fetch_at`),
  ADD KEY `fk_webcal_calendar` (`calendar_id`);

--
-- Indexes for table `workspaces_v1_tb`
--
ALTER TABLE `workspaces_v1_tb`
  ADD PRIMARY KEY (`workspace_id`),
  ADD UNIQUE KEY `uk_user_name_type_range` (`user_id`,`name`,`type`,`date_from`,`date_to`),
  ADD UNIQUE KEY `uk_user_day` (`user_id`,`day_key`),
  ADD KEY `idx_user_type_dates` (`user_id`,`type`,`date_from`,`date_to`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alarms_v1_tb`
--
ALTER TABLE `alarms_v1_tb`
  MODIFY `alarm_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendees_v1_tb`
--
ALTER TABLE `attendees_v1_tb`
  MODIFY `attendee_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `calendars_v1_tb`
--
ALTER TABLE `calendars_v1_tb`
  MODIFY `calendar_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `calendar_acl_v1_tb`
--
ALTER TABLE `calendar_acl_v1_tb`
  MODIFY `acl_id` bigint(20) NOT NULL AUTO_INCREMENT;


--
-- AUTO_INCREMENT for table `items_v1_tb`
--
ALTER TABLE `items_v1_tb`
  MODIFY `item_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_attachments_v1_tb`
--
ALTER TABLE `item_attachments_v1_tb`
  MODIFY `attachment_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_layouts_v1_tb`
--
ALTER TABLE `item_layouts_v1_tb`
  MODIFY `layout_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_remotes_v1_tb`
--
ALTER TABLE `item_remotes_v1_tb`
  MODIFY `item_remote_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `overrides_v1_tb`
--
ALTER TABLE `overrides_v1_tb`
  MODIFY `override_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `provider_webhooks_v1_tb`
--
ALTER TABLE `provider_webhooks_v1_tb`
  MODIFY `webhook_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recurrences_v1_tb`
--
ALTER TABLE `recurrences_v1_tb`
  MODIFY `recurrence_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_accounts_v1_tb`
--
ALTER TABLE `sync_accounts_v1_tb`
  MODIFY `account_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_events_v1_tb`
--
ALTER TABLE `sync_events_v1_tb`
  MODIFY `event_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_mappings_v1_tb`
--
ALTER TABLE `sync_mappings_v1_tb`
  MODIFY `mapping_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `webcal_subscriptions_v1_tb`
--
ALTER TABLE `webcal_subscriptions_v1_tb`
  MODIFY `subscription_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workspaces_v1_tb`
--
ALTER TABLE `workspaces_v1_tb`
  MODIFY `workspace_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alarms_v1_tb`
--
ALTER TABLE `alarms_v1_tb`
  ADD CONSTRAINT `fk_alarms_item` FOREIGN KEY (`item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `attendees_v1_tb`
--
ALTER TABLE `attendees_v1_tb`
  ADD CONSTRAINT `fk_attendees_item` FOREIGN KEY (`item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `calendars_v1_tb`
--
ALTER TABLE `calendars_v1_tb`
  ADD CONSTRAINT `fk_calendars_v1_user` FOREIGN KEY (`user_id`) REFERENCES `users_tb` (`buwana_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `calendar_acl_v1_tb`
--
ALTER TABLE `calendar_acl_v1_tb`
  ADD CONSTRAINT `fk_acl_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `calendars_v1_tb` (`calendar_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_acl_created_by` FOREIGN KEY (`created_by`) REFERENCES `users_tb` (`buwana_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_acl_grantee_user` FOREIGN KEY (`grantee_user_id`) REFERENCES `users_tb` (`buwana_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `items_v1_tb`
--
ALTER TABLE `items_v1_tb`
  ADD CONSTRAINT `fk_items_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `calendars_v1_tb` (`calendar_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_attachments_v1_tb`
--
ALTER TABLE `item_attachments_v1_tb`
  ADD CONSTRAINT `fk_attachments_item` FOREIGN KEY (`item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_layouts_v1_tb`
--
ALTER TABLE `item_layouts_v1_tb`
  ADD CONSTRAINT `fk_layout_item` FOREIGN KEY (`item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_layout_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces_v1_tb` (`workspace_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_remotes_v1_tb`
--
ALTER TABLE `item_remotes_v1_tb`
  ADD CONSTRAINT `fk_itemremotes_account` FOREIGN KEY (`account_id`) REFERENCES `sync_accounts_v1_tb` (`account_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_itemremotes_item` FOREIGN KEY (`item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `overrides_v1_tb`
--
ALTER TABLE `overrides_v1_tb`
  ADD CONSTRAINT `fk_overrides_parent` FOREIGN KEY (`parent_item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `provider_webhooks_v1_tb`
--
ALTER TABLE `provider_webhooks_v1_tb`
  ADD CONSTRAINT `fk_webhooks_account` FOREIGN KEY (`account_id`) REFERENCES `sync_accounts_v1_tb` (`account_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_webhooks_mapping` FOREIGN KEY (`mapping_id`) REFERENCES `sync_mappings_v1_tb` (`mapping_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `recurrences_v1_tb`
--
ALTER TABLE `recurrences_v1_tb`
  ADD CONSTRAINT `fk_recurrence_item` FOREIGN KEY (`item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sync_accounts_v1_tb`
--
ALTER TABLE `sync_accounts_v1_tb`
  ADD CONSTRAINT `fk_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users_tb` (`buwana_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sync_events_v1_tb`
--
ALTER TABLE `sync_events_v1_tb`
  ADD CONSTRAINT `fk_sync_events_account` FOREIGN KEY (`account_id`) REFERENCES `sync_accounts_v1_tb` (`account_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sync_events_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `calendars_v1_tb` (`calendar_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sync_events_item` FOREIGN KEY (`item_id`) REFERENCES `items_v1_tb` (`item_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sync_events_item_remote` FOREIGN KEY (`item_remote_id`) REFERENCES `item_remotes_v1_tb` (`item_remote_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sync_events_mapping` FOREIGN KEY (`mapping_id`) REFERENCES `sync_mappings_v1_tb` (`mapping_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sync_mappings_v1_tb`
--
ALTER TABLE `sync_mappings_v1_tb`
  ADD CONSTRAINT `fk_mappings_account` FOREIGN KEY (`account_id`) REFERENCES `sync_accounts_v1_tb` (`account_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mappings_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `calendars_v1_tb` (`calendar_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `webcal_subscriptions_v1_tb`
--
ALTER TABLE `webcal_subscriptions_v1_tb`
  ADD CONSTRAINT `fk_webcal_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `calendars_v1_tb` (`calendar_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_webcal_user` FOREIGN KEY (`user_id`) REFERENCES `users_tb` (`buwana_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `workspaces_v1_tb`
--
ALTER TABLE `workspaces_v1_tb`
  ADD CONSTRAINT `fk_workspaces_user` FOREIGN KEY (`user_id`) REFERENCES `users_tb` (`buwana_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;