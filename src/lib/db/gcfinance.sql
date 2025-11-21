-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Nov 21, 2025 at 01:29 AM
-- Server version: 8.0.40
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gcfinance`
--

-- --------------------------------------------------------

--
-- Table structure for table `application_distributions`
--

CREATE TABLE `application_distributions` (
  `id` int NOT NULL,
  `loan_application_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `banker_user_id` int NOT NULL,
  `operator_user_id` int NOT NULL,
  `status` enum('sent','viewed','offer_received','declined') DEFAULT 'sent',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `viewed_at` timestamp NULL DEFAULT NULL,
  `response_due_date` datetime NOT NULL,
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `application_distributions`
--

INSERT INTO `application_distributions` (`id`, `loan_application_id`, `bank_id`, `banker_user_id`, `operator_user_id`, `status`, `sent_at`, `viewed_at`, `response_due_date`, `notes`) VALUES
(3, 1, 4, 8, 3, 'offer_received', '2025-11-06 16:48:19', NULL, '2025-11-08 08:48:20', NULL),
(5, 1, 2, 4, 3, 'offer_received', '2025-11-06 16:51:35', NULL, '2025-11-08 08:51:36', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `bankers`
--

CREATE TABLE `bankers` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `branch` varchar(255) NOT NULL,
  `branch_code` varchar(50) NOT NULL,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) NOT NULL,
  `pincode` int NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `loan_categories` json DEFAULT NULL,
  `max_approval_limit` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bankers`
--

INSERT INTO `bankers` (`id`, `user_id`, `bank_id`, `branch`, `branch_code`, `city`, `state`, `pincode`, `employee_id`, `designation`, `department`, `loan_categories`, `max_approval_limit`, `created_at`, `updated_at`) VALUES
(1, 4, 2, 'Paras Plaza', 'HDFC3672', 'washim', 'maharashtra', 444505, 'EB009901', 'Credit Manager', 'Loan', NULL, 10000000.00, '2025-10-30 17:42:28', '2025-11-04 14:16:13'),
(2, 8, 4, 'Dabki Road', 'AXSBDBR01', 'Akola', 'Maharashtra', 444504, 'EMP01', 'Credit Manager', 'Loan', NULL, 1000000.00, '2025-11-04 14:30:42', '2025-11-04 14:30:42');

-- --------------------------------------------------------

--
-- Table structure for table `banks`
--

CREATE TABLE `banks` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `logo_url` varchar(255) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(15) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `banks`
--

INSERT INTO `banks` (`id`, `name`, `code`, `description`, `logo_url`, `contact_email`, `contact_phone`, `website`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'State Bank of India', 'SBI', 'India\'s largest public sector bank', NULL, 'loans@sbi.co.in', NULL, NULL, 1, '2025-10-31 17:17:54', '2025-10-31 17:17:54'),
(2, 'HDFC Bank', 'HDFC', 'Leading private sector bank', NULL, 'personalloans@hdfcbank.com', NULL, NULL, 1, '2025-10-31 17:17:54', '2025-11-03 15:36:11'),
(3, 'ICICI Bank', 'ICICI', 'Premium private bank', NULL, 'loans@icicibank.com', NULL, NULL, 1, '2025-10-31 17:17:54', '2025-10-31 17:17:54'),
(4, 'Axis Bank', 'AXIS', 'Modern banking solutions', NULL, 'creditteam@axisbank.com', NULL, NULL, 1, '2025-10-31 17:17:54', '2025-11-03 15:52:42'),
(5, 'Kotak Mahindra Bank', 'KOTAK', 'Innovative banking', NULL, 'loans@kotak.com', NULL, NULL, 1, '2025-10-31 17:17:54', '2025-10-31 17:17:54'),
(6, 'Indusind Bank', 'INDB', NULL, NULL, NULL, NULL, NULL, 1, '2025-11-03 16:12:04', '2025-11-03 16:12:04');

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE `cities` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cities`
--

INSERT INTO `cities` (`id`, `name`, `state`, `pincode`) VALUES
(3, 'Kankavli', 'Maharashtra', '416602'),
(4, 'Vaibhavwadi', 'Maharashtra', '416620'),
(5, 'Devgad', 'Maharashtra', '416613'),
(6, 'Malvan', 'Maharashtra', '416606'),
(7, 'Sawantwadi', 'Maharashtra', '416510'),
(8, 'Kudal', 'Maharashtra', '416520'),
(9, 'Vengurla', 'Maharashtra', '416516'),
(10, 'Dodamarg', 'Maharashtra', '416512'),
(11, 'Ratnagiri', 'Maharashtra', '415612'),
(12, 'Sangameshwar', 'Maharashtra', '415804'),
(13, 'Lanja', 'Maharashtra', '415803'),
(14, 'Rajapur', 'Maharashtra', '416702'),
(15, 'Chiplun', 'Maharashtra', '415605'),
(16, 'Guhagar', 'Maharashtra', '415724'),
(17, 'Dapoli', 'Maharashtra', '415712'),
(18, 'Mandangad', 'Maharashtra', '415701'),
(19, 'Khed', 'Maharashtra', '415709'),
(20, 'Pen', 'Maharashtra', '402107'),
(21, 'Alibag', 'Maharashtra', '402201'),
(22, 'Murud', 'Maharashtra', '402401'),
(23, 'Panvel', 'Maharashtra', '410206'),
(24, 'Uran', 'Maharashtra', '400702'),
(25, 'Karjat', 'Maharashtra', '410201'),
(26, 'Khalapur', 'Maharashtra', '410202'),
(27, 'Mangaon', 'Maharashtra', '402104'),
(28, 'Tala', 'Maharashtra', '402111'),
(29, 'Roha', 'Maharashtra', '402109'),
(30, 'Sudhagad-Pali', 'Maharashtra', '410205'),
(31, 'Mahad', 'Maharashtra', '402301'),
(32, 'Poladpur', 'Maharashtra', '402303'),
(33, 'Shrivardhan', 'Maharashtra', '410221'),
(34, 'Mhasala', 'Maharashtra', '402105'),
(35, 'Kurla', 'Maharashtra', '400070'),
(36, 'Andheri', 'Maharashtra', '400053'),
(37, 'Borivali', 'Maharashtra', '400092'),
(38, 'Thane', 'Maharashtra', '400601'),
(39, 'Kalyan', 'Maharashtra', '421301'),
(40, 'Murbad', 'Maharashtra', '421401'),
(41, 'Bhiwandi', 'Maharashtra', '421302'),
(42, 'Shahapur', 'Maharashtra', '421601'),
(43, 'Ulhasnagar', 'Maharashtra', '421003'),
(44, 'Ambarnath', 'Maharashtra', '421501'),
(45, 'Palghar', 'Maharashtra', '401404'),
(46, 'Vasai', 'Maharashtra', '401202'),
(47, 'Dahanu', 'Maharashtra', '401602'),
(48, 'Talasari', 'Maharashtra', '401604'),
(49, 'Jawhar', 'Maharashtra', '401603'),
(50, 'Mokhada', 'Maharashtra', '401604'),
(51, 'Vada', 'Maharashtra', '401405'),
(52, 'Vikramgad', 'Maharashtra', '401605'),
(53, 'Nashik', 'Maharashtra', '422001'),
(54, 'Igatpuri', 'Maharashtra', '422403'),
(55, 'Dindori', 'Maharashtra', '422202'),
(56, 'Peth', 'Maharashtra', '422203'),
(57, 'Trimbakeshwar', 'Maharashtra', '422212'),
(58, 'Kalwan', 'Maharashtra', '423501'),
(59, 'Deola', 'Maharashtra', '423102'),
(60, 'Surgana', 'Maharashtra', '422211'),
(61, 'Baglan', 'Maharashtra', '423302'),
(62, 'Malegaon', 'Maharashtra', '423203'),
(63, 'Nandgaon', 'Maharashtra', '423106'),
(64, 'Chandwad', 'Maharashtra', '423101'),
(65, 'Niphad', 'Maharashtra', '422209'),
(66, 'Sinnar', 'Maharashtra', '422103'),
(67, 'Yeola', 'Maharashtra', '423401'),
(68, 'Nandurbar', 'Maharashtra', '425412'),
(69, 'Navapur', 'Maharashtra', '425418'),
(70, 'Shahada', 'Maharashtra', '425409'),
(71, 'Taloda', 'Maharashtra', '425413'),
(72, 'Akkalkuwa', 'Maharashtra', '425415'),
(73, 'Dhadgaon', 'Maharashtra', '425416'),
(74, 'Dhule', 'Maharashtra', '424001'),
(75, 'Sakri', 'Maharashtra', '424304'),
(76, 'Sindkheda', 'Maharashtra', '424002'),
(77, 'Shirpur', 'Maharashtra', '425405'),
(78, 'Jalgaon', 'Maharashtra', '425001'),
(79, 'Jamner', 'Maharashtra', '424206'),
(80, 'Erandol', 'Maharashtra', '424001'),
(81, 'Dharangaon', 'Maharashtra', '425105'),
(82, 'Bhusawal', 'Maharashtra', '425201'),
(83, 'Raver', 'Maharashtra', '425508'),
(84, 'Muktainagar', 'Maharashtra', '425306'),
(85, 'Bodwad', 'Maharashtra', '425310'),
(86, 'Yawal', 'Maharashtra', '425003'),
(87, 'Amalner', 'Maharashtra', '425401'),
(88, 'Parola', 'Maharashtra', '425111'),
(89, 'Chopda', 'Maharashtra', '425107'),
(90, 'Pachora', 'Maharashtra', '424201'),
(91, 'Bhadgaon', 'Maharashtra', '425202'),
(92, 'Chalisgaon', 'Maharashtra', '424101'),
(93, 'Buldhana', 'Maharashtra', '443001'),
(94, 'Chikhli', 'Maharashtra', '443201'),
(95, 'Deulgaon Raja', 'Maharashtra', '443204'),
(96, 'Jalgaon Jamod', 'Maharashtra', '443402'),
(97, 'Sangrampur', 'Maharashtra', '444403'),
(98, 'Malkapur', 'Maharashtra', '443101'),
(99, 'Motala', 'Maharashtra', '443302'),
(100, 'Nandura', 'Maharashtra', '443404'),
(101, 'Khamgaon', 'Maharashtra', '444303'),
(102, 'Shegaon', 'Maharashtra', '444203'),
(103, 'Mehkar', 'Maharashtra', '443301'),
(104, 'Sindkhed Raja', 'Maharashtra', '443205'),
(105, 'Lonar', 'Maharashtra', '443302'),
(106, 'Akola', 'Maharashtra', '444001'),
(107, 'Akot', 'Maharashtra', '444101'),
(108, 'Telhara', 'Maharashtra', '444108'),
(109, 'Balapur', 'Maharashtra', '444302'),
(110, 'Patur', 'Maharashtra', '444501'),
(111, 'Murtajapur', 'Maharashtra', '444107'),
(112, 'Barshitakli', 'Maharashtra', '444403'),
(113, 'Washim', 'Maharashtra', '444505'),
(114, 'Malegaon (Washim)', 'Maharashtra', '444503'),
(115, 'Risod', 'Maharashtra', '444506'),
(116, 'Mangrulpir', 'Maharashtra', '444403'),
(117, 'Karanja (Lad)', 'Maharashtra', '444105'),
(118, 'Manora', 'Maharashtra', '444404'),
(119, 'Amravati', 'Maharashtra', '444601'),
(120, 'Bhatkuli', 'Maharashtra', '444602'),
(121, 'Nandgaon Khandeshwar', 'Maharashtra', '444702'),
(122, 'Dharni', 'Maharashtra', '444702'),
(123, 'Chikhaldara', 'Maharashtra', '444807'),
(124, 'Achalpur', 'Maharashtra', '444806'),
(125, 'Chandurbazar', 'Maharashtra', '444704'),
(126, 'Morshi', 'Maharashtra', '444905'),
(127, 'Warud', 'Maharashtra', '444909'),
(128, 'Daryapur', 'Maharashtra', '444803'),
(129, 'Anjangaon-Surji', 'Maharashtra', '444705'),
(130, 'Chandur Railway', 'Maharashtra', '444904'),
(131, 'Dhamangaon Railway', 'Maharashtra', '444709'),
(132, 'Tiosa', 'Maharashtra', '444720'),
(133, 'Wardha', 'Maharashtra', '442001'),
(134, 'Deoli', 'Maharashtra', '442101'),
(135, 'Seloo', 'Maharashtra', '442104'),
(136, 'Arvi', 'Maharashtra', '442201'),
(137, 'Ashti', 'Maharashtra', '442307'),
(138, 'Karanja', 'Maharashtra', '442105'),
(139, 'Hinganghat', 'Maharashtra', '442301'),
(140, 'Samudrapur', 'Maharashtra', '442305'),
(141, 'Nagpur Urban', 'Maharashtra', '440001'),
(142, 'Nagpur Rural', 'Maharashtra', '440013'),
(143, 'Kamptee', 'Maharashtra', '441002'),
(144, 'Hingna', 'Maharashtra', '442301'),
(145, 'Katol', 'Maharashtra', '441302'),
(146, 'Narkhed', 'Maharashtra', '441303'),
(147, 'Savner', 'Maharashtra', '441104'),
(148, 'Kalameshwar', 'Maharashtra', '441501'),
(149, 'Ramtek', 'Maharashtra', '441106'),
(150, 'Mouda', 'Maharashtra', '441104'),
(151, 'Parseoni', 'Maharashtra', '441105'),
(152, 'Umred', 'Maharashtra', '441203'),
(153, 'Kuhi', 'Maharashtra', '441206'),
(154, 'Bhiwapur', 'Maharashtra', '441205'),
(155, 'Bhandara', 'Maharashtra', '441904'),
(156, 'Tumsar', 'Maharashtra', '441912'),
(157, 'Pauni', 'Maharashtra', '441910'),
(158, 'Mohadi', 'Maharashtra', '441208'),
(159, 'Sakoli', 'Maharashtra', '441802'),
(160, 'Lakhani', 'Maharashtra', '441804'),
(161, 'Lakhandur', 'Maharashtra', '441803'),
(162, 'Gondia', 'Maharashtra', '441601'),
(163, 'Goregaon', 'Maharashtra', '441801'),
(164, 'Salekasa', 'Maharashtra', '441916'),
(165, 'Tiroda', 'Maharashtra', '441911'),
(166, 'Amgaon', 'Maharashtra', '441902'),
(167, 'Deori', 'Maharashtra', '441901'),
(168, 'Arjuni-Morgaon', 'Maharashtra', '441701'),
(169, 'Sadak-Arjuni', 'Maharashtra', '441702'),
(170, 'Gadchiroli', 'Maharashtra', '442605'),
(171, 'Dhanora', 'Maharashtra', '442703'),
(172, 'Chamorshi', 'Maharashtra', '442704'),
(173, 'Mulchera', 'Maharashtra', '442706'),
(174, 'Desaiganj', 'Maharashtra', '442702'),
(175, 'Armori', 'Maharashtra', '442707'),
(176, 'Kurkheda', 'Maharashtra', '442705'),
(177, 'Korchi', 'Maharashtra', '442708'),
(178, 'Aheri', 'Maharashtra', '442716'),
(179, 'Etapalli', 'Maharashtra', '442710'),
(180, 'Bhamragad', 'Maharashtra', '442715'),
(181, 'Sironcha', 'Maharashtra', '442702'),
(182, 'Chandrapur', 'Maharashtra', '442401'),
(183, 'Saoli', 'Maharashtra', '442503'),
(184, 'Mul', 'Maharashtra', '442602'),
(185, 'Ballarpur', 'Maharashtra', '442701'),
(186, 'Pombhurna', 'Maharashtra', '442703'),
(187, 'Gondpimpri', 'Maharashtra', '442502'),
(188, 'Warora', 'Maharashtra', '442907'),
(189, 'Chimur', 'Maharashtra', '442903'),
(190, 'Bhadravati', 'Maharashtra', '442902'),
(191, 'Bramhapuri', 'Maharashtra', '441206'),
(192, 'Nagbhid', 'Maharashtra', '441207'),
(193, 'Sindewahi', 'Maharashtra', '441222'),
(194, 'Rajura', 'Maharashtra', '442905'),
(195, 'Korpana', 'Maharashtra', '442908'),
(196, 'Jiwati', 'Maharashtra', '442909'),
(197, 'Yavatmal', 'Maharashtra', '445001'),
(198, 'Arni', 'Maharashtra', '445103'),
(199, 'Babhulgaon', 'Maharashtra', '445102'),
(200, 'Kalamb', 'Maharashtra', '445401'),
(201, 'Darwha', 'Maharashtra', '445202'),
(202, 'Digras', 'Maharashtra', '445203'),
(203, 'Ner', 'Maharashtra', '445102'),
(204, 'Pusad', 'Maharashtra', '445204'),
(205, 'Umarkhed', 'Maharashtra', '445206'),
(206, 'Mahagaon', 'Maharashtra', '445205'),
(207, 'Kelapur', 'Maharashtra', '445302'),
(208, 'Ralegaon', 'Maharashtra', '445304'),
(209, 'Ghatanji', 'Maharashtra', '445301'),
(210, 'Wani', 'Maharashtra', '445304'),
(211, 'Maregaon', 'Maharashtra', '445303'),
(212, 'Zari Jamani', 'Maharashtra', '445305'),
(213, 'Nanded', 'Maharashtra', '431601'),
(214, 'Ardhapur', 'Maharashtra', '431701'),
(215, 'Mudkhed', 'Maharashtra', '431703'),
(216, 'Bhokar', 'Maharashtra', '431801'),
(217, 'Umri', 'Maharashtra', '431804'),
(218, 'Loha', 'Maharashtra', '431708'),
(219, 'Kandhar', 'Maharashtra', '431714'),
(220, 'Kinwat', 'Maharashtra', '431804'),
(221, 'Himayatnagar', 'Maharashtra', '431803'),
(222, 'Hadgaon', 'Maharashtra', '431712'),
(223, 'Mahur', 'Maharashtra', '431221'),
(224, 'Degloor', 'Maharashtra', '431717'),
(225, 'Mukhed', 'Maharashtra', '431715'),
(226, 'Dharmabad', 'Maharashtra', '431809'),
(227, 'Biloli', 'Maharashtra', '431713'),
(228, 'Naigaon', 'Maharashtra', '431716'),
(229, 'Hingoli', 'Maharashtra', '431513'),
(230, 'Sengaon', 'Maharashtra', '431542'),
(231, 'Kalamnuri', 'Maharashtra', '431702'),
(232, 'Basmath', 'Maharashtra', '431512'),
(233, 'Aundha Nagnath', 'Maharashtra', '431701'),
(234, 'Parbhani', 'Maharashtra', '431401'),
(235, 'Sonpeth', 'Maharashtra', '431516'),
(236, 'Gangakhed', 'Maharashtra', '431514'),
(237, 'Palam', 'Maharashtra', '431517'),
(238, 'Purna', 'Maharashtra', '431511'),
(239, 'Sailu', 'Maharashtra', '431503'),
(240, 'Jintur', 'Maharashtra', '431509'),
(241, 'Manwath', 'Maharashtra', '431505'),
(242, 'Pathri', 'Maharashtra', '431506'),
(243, 'Jalna', 'Maharashtra', '431203'),
(244, 'Bhokardan', 'Maharashtra', '431114'),
(245, 'Jafrabad', 'Maharashtra', '431205'),
(246, 'Badnapur', 'Maharashtra', '431202'),
(247, 'Ambad', 'Maharashtra', '431112'),
(248, 'Ghansawangi', 'Maharashtra', '431302'),
(249, 'Partur', 'Maharashtra', '431501'),
(250, 'Mantha', 'Maharashtra', '431504'),
(251, 'Aurangabad', 'Maharashtra', '431001'),
(252, 'Kannad', 'Maharashtra', '431103'),
(253, 'Soegaon', 'Maharashtra', '431126'),
(254, 'Sillod', 'Maharashtra', '431112'),
(255, 'Phulambri', 'Maharashtra', '431133'),
(256, 'Khuldabad', 'Maharashtra', '431101'),
(257, 'Vaijapur', 'Maharashtra', '423701'),
(258, 'Gangapur', 'Maharashtra', '431109'),
(259, 'Paithan', 'Maharashtra', '431107'),
(260, 'Beed', 'Maharashtra', '431122'),
(261, 'Ashti', 'Maharashtra', '414203'),
(262, 'Patoda', 'Maharashtra', '414204'),
(263, 'Shirur-Kasar', 'Maharashtra', '431124'),
(264, 'Georai', 'Maharashtra', '431127'),
(265, 'Majalgaon', 'Maharashtra', '431131'),
(266, 'Wadwani', 'Maharashtra', '431134'),
(267, 'Kaij', 'Maharashtra', '431123'),
(268, 'Dharur', 'Maharashtra', '431124'),
(269, 'Parli', 'Maharashtra', '431515'),
(270, 'Ambajogai', 'Maharashtra', '431517'),
(271, 'Latur', 'Maharashtra', '413512'),
(272, 'Renapur', 'Maharashtra', '413527'),
(273, 'Ausa', 'Maharashtra', '413520'),
(274, 'Ahmedpur', 'Maharashtra', '413515'),
(275, 'Jalkot', 'Maharashtra', '413531'),
(276, 'Chakur', 'Maharashtra', '413513'),
(277, 'Shirur Anantpal', 'Maharashtra', '413519'),
(278, 'Nilanga', 'Maharashtra', '413521'),
(279, 'Deoni', 'Maharashtra', '413519'),
(280, 'Udgir', 'Maharashtra', '413517'),
(281, 'Osmanabad', 'Maharashtra', '413501'),
(282, 'Tuljapur', 'Maharashtra', '413601'),
(283, 'Bhum', 'Maharashtra', '413510'),
(284, 'Paranda', 'Maharashtra', '413502'),
(285, 'Washi', 'Maharashtra', '413511'),
(286, 'Kalamb (Osmanabad)', 'Maharashtra', '413507'),
(287, 'Lohara', 'Maharashtra', '413613'),
(288, 'Umarga', 'Maharashtra', '413606'),
(289, 'Solapur North', 'Maharashtra', '413002'),
(290, 'Barshi', 'Maharashtra', '413401'),
(291, 'Solapur South', 'Maharashtra', '413004'),
(292, 'Akkalkot', 'Maharashtra', '413216'),
(293, 'Madha', 'Maharashtra', '413209'),
(294, 'Karmala', 'Maharashtra', '413203'),
(295, 'Pandharpur', 'Maharashtra', '413304'),
(296, 'Mohol', 'Maharashtra', '413255'),
(297, 'Malshiras', 'Maharashtra', '413115'),
(298, 'Sangole', 'Maharashtra', '413307'),
(299, 'Mangalvedhe', 'Maharashtra', '413305'),
(300, 'Nagar', 'Maharashtra', '414001'),
(301, 'Shevgaon', 'Maharashtra', '414502'),
(302, 'Pathardi', 'Maharashtra', '414102'),
(303, 'Parner', 'Maharashtra', '414302'),
(304, 'Sangamner', 'Maharashtra', '422605'),
(305, 'Kopargaon', 'Maharashtra', '423601'),
(306, 'Akole', 'Maharashtra', '422601'),
(307, 'Shrirampur', 'Maharashtra', '413709'),
(308, 'Nevasa', 'Maharashtra', '414603'),
(309, 'Rahata', 'Maharashtra', '413705'),
(310, 'Rahuri', 'Maharashtra', '413706'),
(311, 'Shrigonda', 'Maharashtra', '413701'),
(312, 'Karjat (Ahmednagar)', 'Maharashtra', '414201'),
(313, 'Jamkhed', 'Maharashtra', '414204'),
(314, 'Pune City', 'Maharashtra', '411001'),
(315, 'Haveli', 'Maharashtra', '411028'),
(316, 'Khed', 'Maharashtra', '410501'),
(317, 'Junnar', 'Maharashtra', '410502'),
(318, 'Ambegaon', 'Maharashtra', '410503'),
(319, 'Maval', 'Maharashtra', '410506'),
(320, 'Mulshi', 'Maharashtra', '412108'),
(321, 'Shirur', 'Maharashtra', '412210'),
(322, 'Purandhar (Saswad)', 'Maharashtra', '412301'),
(323, 'Velhe', 'Maharashtra', '412212'),
(324, 'Bhor', 'Maharashtra', '412206'),
(325, 'Baramati', 'Maharashtra', '413102'),
(326, 'Indapur', 'Maharashtra', '413106'),
(327, 'Daund', 'Maharashtra', '413801'),
(328, 'Satara', 'Maharashtra', '415002'),
(329, 'Jaoli', 'Maharashtra', '412803'),
(330, 'Koregaon', 'Maharashtra', '415525'),
(331, 'Wai', 'Maharashtra', '412803'),
(332, 'Mahabaleshwar', 'Maharashtra', '412806'),
(333, 'Khandala', 'Maharashtra', '412801'),
(334, 'Phaltan', 'Maharashtra', '415523'),
(335, 'Maan', 'Maharashtra', '415301'),
(336, 'Khatav', 'Maharashtra', '415506'),
(337, 'Patan', 'Maharashtra', '415206'),
(338, 'Karad', 'Maharashtra', '415110'),
(339, 'Miraj', 'Maharashtra', '416410'),
(340, 'Kavathemahankal', 'Maharashtra', '415111'),
(341, 'Tasgaon', 'Maharashtra', '416312'),
(342, 'Jat', 'Maharashtra', '416404'),
(343, 'Walwa', 'Maharashtra', '416313'),
(344, 'Shirala', 'Maharashtra', '415408'),
(345, 'Khanapur (Vita)', 'Maharashtra', '415605'),
(346, 'Atpadi', 'Maharashtra', '415301'),
(347, 'Palus', 'Maharashtra', '416310'),
(348, 'Kadegaon', 'Maharashtra', '415506'),
(349, 'Karvir', 'Maharashtra', '416001'),
(350, 'Panhala', 'Maharashtra', '416201'),
(351, 'Shahuwadi', 'Maharashtra', '416213'),
(352, 'Kagal', 'Maharashtra', '416216'),
(353, 'Hatkanangale', 'Maharashtra', '416112'),
(354, 'Shirol', 'Maharashtra', '416103'),
(355, 'Radhanagari', 'Maharashtra', '416212'),
(356, 'Gaganbawada', 'Maharashtra', '416502'),
(357, 'Bhudargad', 'Maharashtra', '416405'),
(358, 'Gadhinglaj', 'Maharashtra', '416502'),
(359, 'Chandgad', 'Maharashtra', '416509'),
(360, 'Ajra', 'Maharashtra', '416505');

-- --------------------------------------------------------

--
-- Table structure for table `commission_payments`
--

CREATE TABLE `commission_payments` (
  `id` int NOT NULL,
  `payment_reference` varchar(255) NOT NULL,
  `payment_method` enum('bank_transfer','upi','cheque','cash') NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `commission_count` int NOT NULL,
  `payment_date` date NOT NULL,
  `paid_by` int NOT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commission_records`
--

CREATE TABLE `commission_records` (
  `id` int NOT NULL,
  `connector_id` int NOT NULL,
  `loan_application_id` int NOT NULL,
  `commission_amount` decimal(15,2) NOT NULL,
  `commission_percentage` decimal(5,2) NOT NULL,
  `status` enum('earned','paid','pending') DEFAULT 'earned',
  `paid_at` timestamp NULL DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `commission_records`
--

INSERT INTO `commission_records` (`id`, `connector_id`, `loan_application_id`, `commission_amount`, `commission_percentage`, `status`, `paid_at`, `paid_by`, `payment_reference`, `created_at`, `updated_at`) VALUES
(1, 8, 1, 5000.00, 2.00, 'paid', '2025-11-18 17:07:02', NULL, 'transfer', '2025-11-18 16:07:24', '2025-11-18 17:07:02'),
(2, 8, 1, 2000.00, 2.00, 'paid', '2025-11-18 17:07:02', NULL, 'transfer', '2025-11-18 17:03:04', '2025-11-18 17:07:02');

-- --------------------------------------------------------

--
-- Table structure for table `connectors`
--

CREATE TABLE `connectors` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `agent_code` varchar(50) NOT NULL,
  `city` varchar(100) NOT NULL,
  `area` varchar(100) NOT NULL,
  `commission_percentage` decimal(5,2) DEFAULT '0.00',
  `total_cases_submitted` int DEFAULT '0',
  `total_approved_cases` int DEFAULT '0',
  `total_commission_earned` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `connectors`
--

INSERT INTO `connectors` (`id`, `user_id`, `agent_code`, `city`, `area`, `commission_percentage`, `total_cases_submitted`, `total_approved_cases`, `total_commission_earned`, `created_at`, `updated_at`) VALUES
(7, 1, 'AG885068ECN', 'Test City', 'Test Area', 2.50, 0, 0, 0.00, '2025-10-30 15:24:45', '2025-10-30 15:24:45'),
(8, 2, 'AG996377E6A', 'Washim', 'Washim', 2.00, 5, 6, 0.00, '2025-10-30 15:26:36', '2025-11-18 17:03:04');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int NOT NULL,
  `connector_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `marital_status` enum('single','married','divorced','widowed') DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `aadhar_number` varchar(12) NOT NULL,
  `pan_number` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `connector_id`, `first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `gender`, `marital_status`, `address`, `city`, `state`, `pincode`, `aadhar_number`, `pan_number`, `created_at`, `updated_at`) VALUES
(1, 8, 'Shweta', 'Pawar', 'shwetachavan2107@gmail.com', '8087827327', '1995-03-21', 'female', 'married', 'Civil Line Washim', 'Washim', 'Maharashtra', '444505', '878778789889', 'DBMOO7676K', '2025-10-30 15:44:32', '2025-10-30 16:06:18');

-- --------------------------------------------------------

--
-- Table structure for table `customer_documents`
--

CREATE TABLE `customer_documents` (
  `id` int NOT NULL,
  `loan_application_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `document_type_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size_kb` int DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `operator_remarks` text,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_at` timestamp NULL DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `rejection_reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customer_documents`
--

INSERT INTO `customer_documents` (`id`, `loan_application_id`, `customer_id`, `document_type_id`, `file_name`, `file_path`, `file_size_kb`, `verification_status`, `operator_remarks`, `uploaded_at`, `verified_at`, `verified_by`, `rejection_reason`) VALUES
(1, 1, 1, 1, 'Mayur_Rajendra_Pawar_Resume.pdf', '/uploads/documents/1_1_1762280899433_Mayur_Rajendra_Pawar_Resume.pdf', 136, 'verified', NULL, '2025-11-04 18:28:19', '2025-11-04 18:29:31', 3, NULL),
(2, 1, 1, 4, '101WCT-SE-139202412.pdf', '/uploads/documents/1_4_1762269214888_101WCT-SE-139202412.pdf', 27, 'verified', NULL, '2025-11-04 15:13:34', '2025-11-04 15:22:01', 3, NULL),
(3, 1, 1, 5, 'Screenshot 2025-08-28 at 8.51.14 PM.png', '/uploads/documents/1_5_1762961624510_Screenshot_2025-08-28_at_8.51.14_PM.png', 1133, 'verified', NULL, '2025-11-12 15:33:44', '2025-11-12 15:34:42', 3, NULL),
(6, 1, 1, 26, 'pune.png', '/uploads/documents/1_26_1763686501292_pune.png', 6, 'verified', NULL, '2025-11-21 00:55:01', '2025-11-21 01:01:16', 3, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document_types`
--

CREATE TABLE `document_types` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_required` tinyint(1) DEFAULT '1',
  `max_file_size_mb` int DEFAULT '5',
  `allowed_formats` varchar(255) DEFAULT 'pdf,jpg,jpeg,png',
  `is_active` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_pdd` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `document_types`
--

INSERT INTO `document_types` (`id`, `name`, `description`, `is_required`, `max_file_size_mb`, `allowed_formats`, `is_active`, `created_at`, `is_pdd`) VALUES
(1, 'Aadhar Card', 'Government issued identity proof Front And Back', 1, 5, 'pdf,jpg,jpeg,png', 1, '2025-10-29 00:02:09', 0),
(2, 'PAN Card', 'Permanent Account Number card', 1, 5, 'pdf,jpg,jpeg,png', 0, '2025-10-29 00:02:09', 0),
(3, 'Income Certificate/Salary Slips', 'Latest 3 months salary slips or income proof', 1, 10, 'pdf,jpg,jpeg,png', 1, '2025-10-29 00:02:09', 0),
(4, 'Bank Statement', 'Last 6 months bank statement', 1, 10, 'pdf,jpg,jpeg,png', 1, '2025-10-29 00:02:09', 0),
(5, 'Form 16', 'Income tax document for salaried individuals', 0, 5, 'pdf,jpg,jpeg,png', 1, '2025-10-29 00:02:09', 0),
(6, 'ITR Returns', 'Income Tax Returns for last 2 years', 0, 10, 'pdf,jpg,jpeg,png', 1, '2025-10-29 00:02:09', 0),
(7, 'Business Registration', 'Business registration documents for self-employed', 0, 5, 'pdf,jpg,jpeg,png', 1, '2025-10-29 00:02:09', 0),
(8, 'Property Documents', 'For secured loans', 0, 15, 'pdf,jpg,jpeg,png', 0, '2025-10-29 00:02:09', 0),
(9, 'Test Doc', 'Test', 1, 5, 'pdf,jpg,jpeg,png', 0, '2025-11-03 17:41:20', 0),
(10, 'Test', 'Test', 0, 5, 'pdf,jpg,jpeg,png', 0, '2025-11-03 17:41:57', 0),
(11, 'RC Smart Card', 'Vehicle Registration Certificate Copy', 0, 5, 'pdf,jpg,jpeg,png', 0, '2025-11-20 23:36:11', 1),
(12, 'Insurance Policy', 'Vehicle Insurance Policy Copy', 0, 5, 'pdf,jpg,jpeg,png', 1, '2025-11-20 23:36:11', 1),
(13, 'RTO Receipt', 'Tax or Fee Receipt from RTO', 0, 5, 'pdf,jpg,jpeg,png', 1, '2025-11-20 23:36:11', 1),
(14, 'Loan Closure Letter', 'Bank NOC or Closure Letter', 0, 5, 'pdf,jpg,jpeg,png', 1, '2025-11-20 23:36:11', 1);

-- --------------------------------------------------------

--
-- Table structure for table `loan_applications`
--

CREATE TABLE `loan_applications` (
  `id` int NOT NULL,
  `application_number` varchar(50) NOT NULL,
  `customer_id` int NOT NULL,
  `connector_id` int NOT NULL,
  `loan_category_id` int NOT NULL,
  `requested_amount` decimal(15,2) NOT NULL,
  `approved_amount` decimal(15,2) DEFAULT NULL,
  `approved_interest_rate` decimal(5,2) DEFAULT NULL,
  `approved_tenure_months` int DEFAULT NULL,
  `disbursed_amount` decimal(15,2) DEFAULT NULL,
  `disbursed_at` timestamp NULL DEFAULT NULL,
  `disbursement_details` json DEFAULT NULL,
  `banker_remarks` text,
  `special_conditions` text,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `purpose` text NOT NULL,
  `monthly_income` decimal(12,2) NOT NULL,
  `employment_type` enum('salaried','self_employed','business','other') NOT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `work_experience_years` int DEFAULT NULL,
  `existing_loans_amount` decimal(15,2) DEFAULT '0.00',
  `status` enum('submitted','under_verification','verified','sent_to_bankers','approved','rejected','disbursed','document_rejected','document_requested','partially_disbursed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'submitted',
  `cibil_score` int DEFAULT NULL,
  `cibil_report_url` varchar(255) DEFAULT NULL,
  `operator_remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `selected_offer_id` int DEFAULT NULL,
  `marketplace_status` enum('not_distributed','distributed','offers_received','offer_selected','finalized') DEFAULT 'not_distributed',
  `special_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `vehicle_reg_number` varchar(15) DEFAULT NULL,
  `vehicle_valuation` int DEFAULT NULL,
  `vehicle_km` int DEFAULT NULL,
  `vehicle_owner` int DEFAULT NULL,
  `comission_amount` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`id`, `application_number`, `customer_id`, `connector_id`, `loan_category_id`, `requested_amount`, `approved_amount`, `approved_interest_rate`, `approved_tenure_months`, `disbursed_amount`, `disbursed_at`, `disbursement_details`, `banker_remarks`, `special_conditions`, `approved_by`, `approved_at`, `purpose`, `monthly_income`, `employment_type`, `company_name`, `work_experience_years`, `existing_loans_amount`, `status`, `cibil_score`, `cibil_report_url`, `operator_remarks`, `created_at`, `updated_at`, `selected_offer_id`, `marketplace_status`, `special_instructions`, `vehicle_reg_number`, `vehicle_valuation`, `vehicle_km`, `vehicle_owner`, `comission_amount`) VALUES
(1, 'LMS20251104-9856', 1, 8, 6, 600000.00, 600000.00, 10.50, 60, 600000.00, '2025-11-18 15:56:52', '{\"remarks\": \"Remaining Loan Will Disburse After Document Clearing\", \"bank_name\": \"HDFC BANK\", \"ifsc_code\": \"HDFC0003671\", \"disbursed_at\": \"2025-11-18T15:56:52.733Z\", \"disbursed_by\": \"1\", \"account_number\": \"6677678878878\", \"disbursement_date\": \"2025-11-18\", \"transaction_reference\": \"HDFCBN9909090900090\"}', '', NULL, NULL, '2025-11-12 15:58:07', 'To Buy A Car, Self Finance 8 Lakh', 100000.00, 'salaried', 'Wcities inc', 9, 500000.00, 'disbursed', NULL, NULL, '', '2025-11-04 15:10:35', '2025-11-18 17:03:04', 2, 'offer_selected', NULL, 'MH12TS0250', 1400000, 14000, 2, '7000');

-- --------------------------------------------------------

--
-- Table structure for table `loan_categories`
--

CREATE TABLE `loan_categories` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `min_amount` decimal(15,2) DEFAULT NULL,
  `max_amount` decimal(15,2) DEFAULT NULL,
  `interest_rate_min` decimal(5,2) DEFAULT NULL,
  `interest_rate_max` decimal(5,2) DEFAULT NULL,
  `max_tenure_months` int DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loan_categories`
--

INSERT INTO `loan_categories` (`id`, `name`, `description`, `min_amount`, `max_amount`, `interest_rate_min`, `interest_rate_max`, `max_tenure_months`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Personal Loan', 'Unsecured personal loans', 25000.00, 2000000.00, 10.50, 24.00, 84, 'active', '2025-10-29 00:02:09', '2025-10-29 00:02:09'),
(2, 'Home Loan', 'Secured home loans', 500000.00, 50000000.00, 8.50, 12.00, 360, 'active', '2025-10-29 00:02:09', '2025-10-29 00:02:09'),
(3, 'Auto Loan', 'Vehicle financing', 100000.00, 5000000.00, 7.50, 15.00, 84, 'active', '2025-10-29 00:02:09', '2025-11-04 14:42:41'),
(4, 'Business Loan', 'Loans for business purposes', 50000.00, 10000000.00, 11.00, 20.00, 120, 'active', '2025-10-29 00:02:09', '2025-10-29 00:02:09'),
(5, 'Education Loan', 'Higher education financing', 50000.00, 7500000.00, 9.50, 15.00, 180, 'active', '2025-10-29 00:02:09', '2025-10-29 00:02:09'),
(6, 'Used Auto Loan', 'Vehicle financing for used vehicles', 100000.00, 5000000.00, 7.50, 15.00, 84, 'active', '2025-10-29 00:02:09', '2025-11-04 14:42:41');

-- --------------------------------------------------------

--
-- Table structure for table `loan_disbursements`
--

CREATE TABLE `loan_disbursements` (
  `id` int NOT NULL,
  `loan_application_id` int NOT NULL,
  `loan_offer_id` int NOT NULL,
  `disbursed_amount` decimal(15,2) NOT NULL,
  `disbursement_date` date NOT NULL,
  `reference_number` varchar(100) NOT NULL,
  `bank_reference` varchar(100) DEFAULT NULL,
  `disbursement_method` enum('bank_transfer','cheque','cash') DEFAULT 'bank_transfer',
  `connector_commission` decimal(10,2) NOT NULL,
  `commission_status` enum('pending','paid') DEFAULT 'pending',
  `disbursed_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loan_disbursements`
--

INSERT INTO `loan_disbursements` (`id`, `loan_application_id`, `loan_offer_id`, `disbursed_amount`, `disbursement_date`, `reference_number`, `bank_reference`, `disbursement_method`, `connector_commission`, `commission_status`, `disbursed_by`, `created_at`) VALUES
(1, 1, 2, 400000.00, '2025-11-18', 'utr5656656565656', 'HDFC', 'bank_transfer', 5000.00, 'pending', 1, '2025-11-18 16:07:24'),
(2, 1, 2, 200000.00, '2025-11-18', 'urtasdfa898998989', 'HDFC BANK', 'bank_transfer', 2000.00, 'pending', 1, '2025-11-18 17:03:04');

-- --------------------------------------------------------

--
-- Table structure for table `loan_offers`
--

CREATE TABLE `loan_offers` (
  `id` int NOT NULL,
  `loan_application_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `banker_user_id` int NOT NULL,
  `offered_amount` decimal(12,2) NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `tenure_months` int NOT NULL,
  `processing_fee` decimal(10,2) DEFAULT '0.00',
  `monthly_emi` decimal(10,2) GENERATED ALWAYS AS (((`offered_amount` * (`interest_rate` / 1200)) / (1 - pow((1 + (`interest_rate` / 1200)),-(`tenure_months`))))) VIRTUAL,
  `total_interest` decimal(12,2) GENERATED ALWAYS AS (((`monthly_emi` * `tenure_months`) - `offered_amount`)) VIRTUAL,
  `total_payable` decimal(12,2) GENERATED ALWAYS AS ((`monthly_emi` * `tenure_months`)) VIRTUAL,
  `status` enum('pending','active','selected','rejected','expired') DEFAULT 'active',
  `valid_until` datetime NOT NULL,
  `terms_conditions` text,
  `special_features` text,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loan_offers`
--

INSERT INTO `loan_offers` (`id`, `loan_application_id`, `bank_id`, `banker_user_id`, `offered_amount`, `interest_rate`, `tenure_months`, `processing_fee`, `status`, `valid_until`, `terms_conditions`, `special_features`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 4, 600000.00, 11.00, 60, 3499.00, 'rejected', '2025-11-13 09:46:38', '', '', '', '2025-11-06 17:46:37', '2025-11-12 15:58:07'),
(2, 1, 4, 8, 600000.00, 10.50, 60, 5000.00, 'selected', '2025-11-19 07:54:31', '', '', '', '2025-11-12 15:54:30', '2025-11-12 15:58:07');

-- --------------------------------------------------------

--
-- Table structure for table `post_disbursement_cases`
--

CREATE TABLE `post_disbursement_cases` (
  `id` int NOT NULL,
  `loan_application_id` int NOT NULL,
  `rto_agent_id` int DEFAULT NULL,
  `status` enum('pending','agent_assigned','rto_process_started','documents_pending','completed') DEFAULT 'pending',
  `rc_number` varchar(50) DEFAULT NULL,
  `rc_status` enum('pending','received','handed_over') DEFAULT 'pending',
  `remarks` text,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `post_disbursement_cases`
--

INSERT INTO `post_disbursement_cases` (`id`, `loan_application_id`, `rto_agent_id`, `status`, `rc_number`, `rc_status`, `remarks`, `assigned_at`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'rto_process_started', NULL, 'pending', '', '2025-11-21 00:25:53', NULL, '2025-11-21 00:00:05', '2025-11-21 00:25:53');

-- --------------------------------------------------------

--
-- Table structure for table `rto_agents`
--

CREATE TABLE `rto_agents` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `city` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `rto_agents`
--

INSERT INTO `rto_agents` (`id`, `name`, `phone`, `city`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Nadeem Sheikh', '7878999999', 'Washim', 1, '2025-11-20 23:47:51', '2025-11-20 23:47:51'),
(2, 'Gajanan Gayakwad', '6767767667', 'Akola', 1, '2025-11-20 23:48:13', '2025-11-20 23:49:31');

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(200) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 13:41:14'),
(2, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 13:41:20'),
(3, 1, 'USER_UPDATED', 'user', 4, NULL, '{\"city\": \"Washim\", \"role\": \"banker\", \"email\": \"banker@example.com\", \"phone\": \"9090909090\", \"state\": \"Maharashtra\", \"branch\": \"paras plaza\", \"status\": \"active\", \"address\": \"Test\", \"bank_id\": 2, \"pincode\": \"444505\", \"password\": \"\", \"last_name\": \"Sir\", \"department\": \"Loan\", \"first_name\": \"Banker\", \"branch_code\": \"HDFC3671\", \"designation\": \"Manager\", \"employee_id\": \"EB009901\", \"connector_area\": \"\", \"connector_city\": \"\", \"max_approval_limit\": \"10000000.00\", \"commission_percentage\": 2.5}', '::1', NULL, '2025-11-04 14:15:43'),
(4, 1, 'USER_UPDATED', 'user', 4, NULL, '{\"city\": \"Washim\", \"role\": \"banker\", \"email\": \"banker@example.com\", \"phone\": \"9090909090\", \"state\": \"Maharashtra\", \"branch\": \"Paras Plaza\", \"status\": \"active\", \"address\": \"Test\", \"bank_id\": 2, \"pincode\": \"444505\", \"password\": \"\", \"last_name\": \"Sir\", \"department\": \"Loan\", \"first_name\": \"Banker\", \"branch_code\": \"HDFC3672\", \"designation\": \"Credit Manager\", \"employee_id\": \"EB009901\", \"connector_area\": \"\", \"connector_city\": \"\", \"max_approval_limit\": \"10000000.00\", \"commission_percentage\": 2.5}', '::1', NULL, '2025-11-04 14:16:13'),
(5, 1, 'USER_CREATED', NULL, NULL, NULL, '{\"role\": \"banker\", \"email\": \"swapnil@example.com\", \"created_user_id\": 8}', '::1', NULL, '2025-11-04 14:30:42'),
(6, 1, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 14:34:45'),
(7, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 14:34:50'),
(8, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 14:40:48'),
(9, 2, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 14:40:54'),
(10, 2, 'LOAN_APPLICATION_CREATED', 'loan_application', 1, NULL, '{\"customer_id\": 1, \"loan_category_id\": \"6\", \"requested_amount\": \"600000\", \"application_number\": \"LMS20251104-9856\"}', '::1', NULL, '2025-11-04 15:10:35'),
(11, 2, 'DOCUMENT_UPLOADED', 'document', 1, NULL, '{\"filename\": \"1_1_1762269181846_admin-report-overview-2025-10-30.pdf\", \"document_type\": \"Aadhar Card\", \"loan_application_id\": \"1\"}', '::1', NULL, '2025-11-04 15:13:01'),
(12, 2, 'DOCUMENT_UPLOADED', 'document', 2, NULL, '{\"filename\": \"1_4_1762269214888_101WCT-SE-139202412.pdf\", \"document_type\": \"Bank Statement\", \"loan_application_id\": \"1\"}', '::1', NULL, '2025-11-04 15:13:34'),
(13, 2, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:13:39'),
(14, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:13:44'),
(15, 3, 'STATUS_UPDATE', 'loan_application', 1, NULL, '{\"remarks\": null, \"new_status\": \"under_verification\", \"old_status\": \"submitted\", \"updated_by_role\": \"operator\"}', '::1', NULL, '2025-11-04 15:16:47'),
(16, 3, 'DOCUMENT_VERIFIED', 'customer_document', 2, NULL, '{\"document_id\": \"2\", \"rejection_reason\": \"OK\", \"verification_status\": \"verified\"}', '::1', NULL, '2025-11-04 15:22:01'),
(17, 3, 'DOCUMENT_VERIFIED', 'customer_document', 1, NULL, '{\"document_id\": \"1\", \"rejection_reason\": \"Upload Both Sides\", \"verification_status\": \"rejected\"}', '::1', NULL, '2025-11-04 15:22:08'),
(18, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:22:33'),
(19, 2, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:22:39'),
(20, 2, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:33:15'),
(21, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:33:19'),
(22, 3, 'DOCUMENT_VERIFIED', 'customer_document', 1, NULL, '{\"document_id\": \"1\", \"rejection_reason\": \"Upload Both Sides\", \"verification_status\": \"rejected\"}', '::1', NULL, '2025-11-04 15:33:41'),
(23, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:38:23'),
(24, 2, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 15:38:29'),
(25, 2, 'DOCUMENT_REUPLOADED', 'document', 1, NULL, '{\"filename\": \"1_1_1762280899433_Mayur_Rajendra_Pawar_Resume.pdf\", \"document_id\": \"1\", \"document_type\": \"Aadhar Card\"}', '::1', NULL, '2025-11-04 18:28:19'),
(26, 2, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 18:29:08'),
(27, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-04 18:29:13'),
(28, 3, 'DOCUMENT_VERIFIED', 'customer_document', 1, NULL, '{\"document_id\": \"1\", \"rejection_reason\": \"OK NOW\", \"verification_status\": \"verified\"}', '::1', NULL, '2025-11-04 18:29:31'),
(29, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-05 13:23:52'),
(30, 2, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-05 13:23:59'),
(31, 2, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-05 15:35:33'),
(32, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-05 15:35:46'),
(33, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 14:43:10'),
(34, 1, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 14:44:02'),
(35, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 14:44:09'),
(36, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 14:44:32'),
(37, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 14:44:49'),
(38, 3, 'APPLICATION_DISTRIBUTED', 'loan_application', 1, NULL, '{\"response_due_hours\": 48, \"distributed_to_banks\": 1}', '::1', NULL, '2025-11-06 16:32:16'),
(39, 3, 'APPLICATION_DISTRIBUTED', 'loan_application', 1, NULL, '{\"banker_id\": \"2\", \"response_due_hours\": 48, \"distributed_to_banks\": \"4\"}', '::1', NULL, '2025-11-06 16:42:43'),
(40, 3, 'APPLICATION_DISTRIBUTED', 'loan_application', 1, NULL, '{\"banker_id\": \"8\", \"response_due_hours\": 48, \"distributed_to_banks\": \"4\"}', '::1', NULL, '2025-11-06 16:44:25'),
(41, 3, 'APPLICATION_DISTRIBUTED', 'loan_application', 1, NULL, '{\"banker_id\": \"8\", \"response_due_hours\": 48, \"distributed_to_banks\": \"4\"}', '::1', NULL, '2025-11-06 16:48:19'),
(42, 3, 'APPLICATION_DISTRIBUTED', 'loan_application', 1, NULL, '{\"banker_id\": \"4\", \"response_due_hours\": 48, \"distributed_to_banks\": \"2\"}', '::1', NULL, '2025-11-06 16:51:35'),
(43, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 16:53:39'),
(44, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 16:53:44'),
(45, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 16:54:15'),
(46, 8, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 16:54:34'),
(47, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:30:42'),
(48, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:30:46'),
(49, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:31:00'),
(50, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:31:03'),
(51, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:31:12'),
(52, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:31:15'),
(53, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:47:11'),
(54, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-06 17:47:15'),
(55, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 14:54:30'),
(56, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:09:55'),
(57, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:09:59'),
(58, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:25:39'),
(59, 8, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:25:58'),
(60, 8, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:26:55'),
(61, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:26:59'),
(62, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:27:28'),
(63, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:27:33'),
(64, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:28:06'),
(65, 2, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:28:14'),
(66, 2, 'DOCUMENT_UPLOADED', 'document', 3, NULL, '{\"filename\": \"1_5_1762961624510_Screenshot_2025-08-28_at_8.51.14_PM.png\", \"document_type\": \"Form 16\", \"loan_application_id\": \"1\"}', '::1', NULL, '2025-11-12 15:33:44'),
(67, 2, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:34:19'),
(68, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:34:26'),
(69, 3, 'DOCUMENT_VERIFIED', 'customer_document', 3, NULL, '{\"document_id\": \"3\", \"rejection_reason\": null, \"verification_status\": \"verified\"}', '::1', NULL, '2025-11-12 15:34:42'),
(70, 3, 'STATUS_UPDATE', 'loan_application', 1, NULL, '{\"remarks\": \"All documents verified\", \"new_status\": \"verified\", \"old_status\": \"document_requested\", \"updated_by_role\": \"operator\"}', '::1', NULL, '2025-11-12 15:38:31'),
(71, 3, 'STATUS_UPDATE', 'loan_application', 1, NULL, '{\"remarks\": \"All documents verified\", \"new_status\": \"verified\", \"old_status\": \"document_requested\", \"updated_by_role\": \"operator\"}', '::1', NULL, '2025-11-12 15:43:04'),
(72, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:43:28'),
(73, 8, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:43:32'),
(74, 8, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:43:42'),
(75, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:43:46'),
(76, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:45:08'),
(77, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:45:59'),
(78, 3, 'STATUS_UPDATE', 'loan_application', 1, NULL, '{\"remarks\": \"All documents verified\", \"new_status\": \"sent_to_bankers\", \"old_status\": \"document_requested\", \"updated_by_role\": \"operator\"}', '::1', NULL, '2025-11-12 15:52:21'),
(79, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:52:26'),
(80, 8, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:52:30'),
(81, 8, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:54:55'),
(82, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:54:58'),
(83, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:57:23'),
(84, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:57:27'),
(85, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:58:15'),
(86, 4, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:58:18'),
(87, 4, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:59:04'),
(88, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-12 15:59:29'),
(89, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-18 15:17:02'),
(90, 1, 'LOAN_PARTIALLY_DISBURSED', 'loan_application', 1, NULL, '{\"bank_name\": \"HDFC BANK\", \"account_number\": \"8878\", \"disbursed_amount\": \"400000.00\", \"application_number\": \"LMS20251104-9856\", \"transaction_reference\": \"HDFCBN9909090900090\"}', '::1', NULL, '2025-11-18 15:56:06'),
(91, 1, 'LOAN_PARTIALLY_DISBURSED', 'loan_application', 1, NULL, '{\"bank_name\": \"HDFC BANK\", \"account_number\": \"8878\", \"disbursed_amount\": \"400000.00\", \"application_number\": \"LMS20251104-9856\", \"transaction_reference\": \"HDFCBN9909090900090\"}', '::1', NULL, '2025-11-18 15:56:52'),
(92, 1, 'LOAN_DISBURSED_PARTIALLY', 'loan_application', 1, NULL, '{\"status\": \"partially_disbursed\", \"bank_name\": \"HDFC\", \"account_number\": \"5432\", \"disbursed_amount\": 400000, \"application_number\": \"LMS20251104-9856\", \"transaction_reference\": \"utr5656656565656\"}', '::1', NULL, '2025-11-18 16:07:24'),
(93, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-18 16:35:58'),
(94, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-18 16:40:54'),
(95, 1, 'LOAN_DISBURSED_FULLY', 'loan_application', 1, NULL, '{\"status\": \"disbursed\", \"bank_name\": \"HDFC BANK\", \"account_number\": \"8787\", \"disbursed_amount\": 200000, \"application_number\": \"LMS20251104-9856\", \"transaction_reference\": \"urtasdfa898998989\"}', '::1', NULL, '2025-11-18 17:03:04'),
(96, 1, 'COMMISSION_PAID', 'commission_batch', NULL, NULL, '{\"total_amount\": 7000, \"commission_ids\": [2, 1], \"payment_method\": \"Bank Transfer\", \"connector_count\": 2, \"payment_reference\": \"transfer\"}', '::1', NULL, '2025-11-18 17:07:02'),
(97, 1, 'DOCUMENT_UPLOADED', 'document', 4, NULL, '{\"filename\": \"1_12_1763684694247_pune.png\", \"document_type\": \"Insurance Policy\", \"loan_application_id\": \"1\"}', '::1', NULL, '2025-11-21 00:24:54'),
(98, 1, 'DOCUMENT_UPLOADED', 'document', 5, NULL, '{\"filename\": \"1_26_1763685725332_Copy_of_Bixby-Alexa-Calls.pdf\", \"document_type\": \"RC Copy\", \"loan_application_id\": \"1\"}', '::1', NULL, '2025-11-21 00:42:05'),
(99, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 2, NULL, NULL, '::1', NULL, '2025-11-21 00:51:03'),
(100, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 15, NULL, NULL, '::1', NULL, '2025-11-21 00:51:48'),
(101, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 18, NULL, NULL, '::1', NULL, '2025-11-21 00:51:54'),
(102, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 21, NULL, NULL, '::1', NULL, '2025-11-21 00:51:58'),
(103, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 24, NULL, NULL, '::1', NULL, '2025-11-21 00:52:03'),
(104, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 19, NULL, NULL, '::1', NULL, '2025-11-21 00:52:10'),
(105, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 17, NULL, NULL, '::1', NULL, '2025-11-21 00:52:14'),
(106, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 27, NULL, NULL, '::1', NULL, '2025-11-21 00:52:18'),
(107, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 20, NULL, NULL, '::1', NULL, '2025-11-21 00:52:28'),
(108, 1, 'DOCUMENT_TYPE_DELETED', 'document_type', 11, NULL, NULL, '::1', NULL, '2025-11-21 00:52:53'),
(109, 1, 'DOCUMENT_UPLOADED', 'document', 6, NULL, '{\"filename\": \"1_26_1763686501292_pune.png\", \"document_type\": \"RC Copy\", \"loan_application_id\": \"1\"}', '::1', NULL, '2025-11-21 00:55:01'),
(110, 1, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-21 01:00:19'),
(111, 3, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-21 01:00:23'),
(112, 3, 'DOCUMENT_VERIFIED', 'customer_document', 6, NULL, '{\"document_id\": \"6\", \"rejection_reason\": null, \"verification_status\": \"verified\"}', '::1', NULL, '2025-11-21 01:01:16'),
(113, 3, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-21 01:24:06'),
(114, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-21 01:24:10'),
(115, 1, 'USER_LOGOUT', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-21 01:26:12'),
(116, 1, 'USER_LOGIN', NULL, NULL, NULL, NULL, '::1', NULL, '2025-11-21 01:26:59');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','connector','operator','banker') NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin@example.com', '$2b$12$uFAJPLrmguvzGR.CO4k1CO22NZt1YI7cYNQ5wPf5psegC8wCqHovW', 'super_admin', 'active', '2025-10-30 15:24:45', '2025-10-30 15:25:41'),
(2, 'mayur@example.com', '$2b$10$LDIaMG3zTg6hJz2B3EEnju5Q4cYOE8H427uIHQJnGN5qMe6MWHJ4i', 'connector', 'active', '2025-10-30 15:26:36', '2025-10-31 15:36:48'),
(3, 'operator@example.com', '$2b$12$PFdWBjfwbmkXN4k9zR0pLuBzlRhOAR46sU06b7ezK3a.xnmcBqM7y', 'operator', 'active', '2025-10-30 17:41:22', '2025-10-30 17:41:22'),
(4, 'banker@example.com', '$2b$12$uYWpA7rhor4s2lMq/TmFKePan.F/NyY.zlUC/9U59/wRQc87Rct4K', 'banker', 'active', '2025-10-30 17:42:28', '2025-10-30 17:42:28'),
(8, 'swapnil@example.com', '$2b$12$iuFsp8agkODmaab94XoQ6.O7OikgKv27OwSQPoRkEiC0FlN6Ts8oK', 'banker', 'active', '2025-11-04 14:30:42', '2025-11-04 14:30:42');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `aadhar_number` varchar(12) DEFAULT NULL,
  `pan_number` varchar(10) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `first_name`, `last_name`, `phone`, `address`, `city`, `state`, `pincode`, `aadhar_number`, `pan_number`, `profile_image`, `created_at`, `updated_at`) VALUES
(1, 1, 'Super', 'Admin', '8989898989', 'Test Address', 'Test City', 'Test', '411033', NULL, NULL, NULL, '2025-10-30 15:24:45', '2025-10-30 15:24:45'),
(2, 2, 'Mayur', 'Pawar', '8087827327', 'Civil Line', 'Washim', 'Maharashtra', '444505', NULL, NULL, NULL, '2025-10-30 15:26:36', '2025-10-31 15:09:03'),
(3, 3, 'Operator', 'Sir', '9090909090', 'Test', 'Washim', 'Maharashtra', '444505', NULL, NULL, NULL, '2025-10-30 17:41:22', '2025-10-30 17:41:22'),
(4, 4, 'Banker', 'Sir', '9090909090', 'Test', 'Washim', 'Maharashtra', '444505', NULL, NULL, NULL, '2025-10-30 17:42:28', '2025-10-30 17:42:28'),
(8, 8, 'Swapnil', 'Kale', '8989090909', 'Dabki Road Akola', 'Akola', 'Maharashtra', '444504', NULL, NULL, NULL, '2025-11-04 14:30:42', '2025-11-04 14:30:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `application_distributions`
--
ALTER TABLE `application_distributions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bankers`
--
ALTER TABLE `bankers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_bank_id` (`bank_id`);

--
-- Indexes for table `banks`
--
ALTER TABLE `banks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `commission_payments`
--
ALTER TABLE `commission_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_reference` (`payment_reference`),
  ADD KEY `idx_payment_reference` (`payment_reference`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_paid_by` (`paid_by`);

--
-- Indexes for table `commission_records`
--
ALTER TABLE `commission_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_connector` (`connector_id`),
  ADD KEY `idx_loan_application` (`loan_application_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `connectors`
--
ALTER TABLE `connectors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `agent_code` (`agent_code`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_agent_code` (`agent_code`),
  ADD KEY `idx_city` (`city`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `aadhar_number` (`aadhar_number`),
  ADD UNIQUE KEY `pan_number` (`pan_number`),
  ADD KEY `idx_connector_id` (`connector_id`),
  ADD KEY `idx_aadhar` (`aadhar_number`),
  ADD KEY `idx_pan` (`pan_number`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `customer_documents`
--
ALTER TABLE `customer_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `document_type_id` (`document_type_id`),
  ADD KEY `verified_by` (`verified_by`),
  ADD KEY `idx_loan_application` (`loan_application_id`),
  ADD KEY `idx_verification_status` (`verification_status`),
  ADD KEY `idx_customer` (`customer_id`);

--
-- Indexes for table `document_types`
--
ALTER TABLE `document_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_required` (`is_required`);

--
-- Indexes for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_number` (`application_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `loan_category_id` (`loan_category_id`),
  ADD KEY `idx_application_number` (`application_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_connector_id` (`connector_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `loan_categories`
--
ALTER TABLE `loan_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `loan_disbursements`
--
ALTER TABLE `loan_disbursements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_number` (`reference_number`),
  ADD KEY `loan_application_id` (`loan_application_id`),
  ADD KEY `loan_offer_id` (`loan_offer_id`),
  ADD KEY `disbursed_by` (`disbursed_by`),
  ADD KEY `idx_reference_number` (`reference_number`),
  ADD KEY `idx_commission_status` (`commission_status`);

--
-- Indexes for table `loan_offers`
--
ALTER TABLE `loan_offers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `post_disbursement_cases`
--
ALTER TABLE `post_disbursement_cases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `loan_application_id` (`loan_application_id`),
  ADD KEY `rto_agent_id` (`rto_agent_id`);

--
-- Indexes for table `rto_agents`
--
ALTER TABLE `rto_agents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_aadhar` (`aadhar_number`),
  ADD KEY `idx_pan` (`pan_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `application_distributions`
--
ALTER TABLE `application_distributions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `bankers`
--
ALTER TABLE `bankers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `banks`
--
ALTER TABLE `banks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `cities`
--
ALTER TABLE `cities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=361;

--
-- AUTO_INCREMENT for table `commission_payments`
--
ALTER TABLE `commission_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `commission_records`
--
ALTER TABLE `commission_records`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `connectors`
--
ALTER TABLE `connectors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customer_documents`
--
ALTER TABLE `customer_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `document_types`
--
ALTER TABLE `document_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `loan_applications`
--
ALTER TABLE `loan_applications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `loan_categories`
--
ALTER TABLE `loan_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `loan_disbursements`
--
ALTER TABLE `loan_disbursements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `loan_offers`
--
ALTER TABLE `loan_offers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `post_disbursement_cases`
--
ALTER TABLE `post_disbursement_cases`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `rto_agents`
--
ALTER TABLE `rto_agents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
