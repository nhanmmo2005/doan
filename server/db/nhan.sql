-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: foodbook
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `media_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` enum('image','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('normal','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_chat_messages_room` (`room_id`),
  KEY `fk_chat_messages_user` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_chat_messages_room` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (4,5,2,'ok',NULL,NULL,'normal','2026-01-16 04:06:01'),(5,5,2,'đ*t',NULL,NULL,'normal','2026-01-16 09:00:23'),(6,5,2,'l*n',NULL,NULL,'normal','2026-01-16 09:00:26'),(7,5,2,'c*c',NULL,NULL,'normal','2026-01-16 09:00:27'),(8,5,2,'kẹt',NULL,NULL,'normal','2026-01-16 09:00:33'),(9,7,2,'alo',NULL,NULL,'normal','2026-01-16 09:00:55'),(10,7,2,'ok','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768555479807-93e95122be3f76da.mp4','video','normal','2026-01-16 09:24:41'),(11,7,2,'ok',NULL,NULL,'normal','2026-01-16 09:32:56'),(12,7,2,'ok',NULL,NULL,'normal','2026-01-21 01:10:32');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_rooms`
--

DROP TABLE IF EXISTS `chat_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `topic` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int NOT NULL,
  `status` enum('active','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_chat_rooms_creator` (`created_by`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_chat_rooms_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_rooms`
--

LOCK TABLES `chat_rooms` WRITE;
/*!40000 ALTER TABLE `chat_rooms` DISABLE KEYS */;
INSERT INTO `chat_rooms` VALUES (1,'Ăn đêm','Rủ nhau đi ăn đêm tại Đà Nẵng','eating',1,'active','2026-01-16 04:01:05','2026-01-16 04:01:05'),(2,'Sinh viên','Phòng chat dành cho sinh viên','student',1,'active','2026-01-16 04:01:05','2026-01-16 04:01:05'),(3,'Ăn cay','Những món ăn cay nồng','spicy',1,'active','2026-01-16 04:01:05','2026-01-16 04:01:05'),(4,'Review quán','Chia sẻ review các quán ăn','review',1,'active','2026-01-16 04:01:05','2026-01-16 04:01:05'),(5,'Tìm đồng hành','Tìm người đi ăn cùng','companion',1,'active','2026-01-16 04:01:05','2026-01-16 04:01:05'),(7,'Hội người cao tuổi cô đơn',NULL,NULL,2,'active','2026-01-16 09:00:50','2026-01-16 09:00:50');
/*!40000 ALTER TABLE `chat_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_media`
--

DROP TABLE IF EXISTS `comment_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `comment_id` int NOT NULL,
  `media_type` enum('image','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comment_media_comment` (`comment_id`),
  CONSTRAINT `fk_comment_media_comment` FOREIGN KEY (`comment_id`) REFERENCES `post_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_media`
--

LOCK TABLES `comment_media` WRITE;
/*!40000 ALTER TABLE `comment_media` DISABLE KEYS */;
INSERT INTO `comment_media` VALUES (1,3,'video','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768555112306-2852c8f5bf8964ae.mp4',0,'2026-01-16 09:18:34'),(2,4,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768555781090-41a345cf0a20a8c4.jpg',0,'2026-01-16 09:29:42'),(3,4,'video','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768555781091-5bbad99e08b13ce5.mp4',1,'2026-01-16 09:29:42');
/*!40000 ALTER TABLE `comment_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eating_plan_comments`
--

DROP TABLE IF EXISTS `eating_plan_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eating_plan_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eating_plan_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ep_comments_plan` (`eating_plan_id`),
  KEY `fk_ep_comments_user` (`user_id`),
  KEY `idx_ep_comments_parent` (`parent_id`),
  CONSTRAINT `fk_ep_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `eating_plan_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ep_comments_plan` FOREIGN KEY (`eating_plan_id`) REFERENCES `eating_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ep_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eating_plan_comments`
--

LOCK TABLES `eating_plan_comments` WRITE;
/*!40000 ALTER TABLE `eating_plan_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `eating_plan_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eating_plan_participants`
--

DROP TABLE IF EXISTS `eating_plan_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eating_plan_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eating_plan_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('pending','confirmed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participant` (`eating_plan_id`,`user_id`),
  KEY `fk_participants_user` (`user_id`),
  CONSTRAINT `fk_participants_plan` FOREIGN KEY (`eating_plan_id`) REFERENCES `eating_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eating_plan_participants`
--

LOCK TABLES `eating_plan_participants` WRITE;
/*!40000 ALTER TABLE `eating_plan_participants` DISABLE KEYS */;
INSERT INTO `eating_plan_participants` VALUES (2,4,2,'confirmed','2026-01-16 08:37:01'),(3,4,1,'confirmed','2026-01-16 09:46:40');
/*!40000 ALTER TABLE `eating_plan_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eating_plans`
--

DROP TABLE IF EXISTS `eating_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eating_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `restaurant_id` int DEFAULT NULL,
  `restaurant_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planned_at` datetime NOT NULL,
  `max_participants` int DEFAULT NULL,
  `estimated_cost` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('open','closed','completed','cancelled','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_eating_plans_user` (`user_id`),
  KEY `fk_eating_plans_restaurant` (`restaurant_id`),
  KEY `idx_planned_at` (`planned_at`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_eating_plans_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_eating_plans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eating_plans`
--

LOCK TABLES `eating_plans` WRITE;
/*!40000 ALTER TABLE `eating_plans` DISABLE KEYS */;
INSERT INTO `eating_plans` VALUES (4,2,'xem phim con heo','đem bcs',NULL,'428 tôn đản','428 tôn đản','2026-01-22 20:42:00',2,'500','deleted','2026-01-16 08:37:01','2026-01-21 01:14:31');
/*!40000 ALTER TABLE `eating_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_post_comments_post` (`post_id`),
  KEY `idx_post_comments_parent` (`parent_id`),
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `post_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
INSERT INTO `post_comments` VALUES (1,5,1,NULL,'vãi','2026-01-16 08:25:45'),(2,5,1,1,'ok','2026-01-16 08:25:49'),(3,5,2,NULL,'admin','2026-01-16 09:18:34'),(4,5,2,NULL,'ok','2026-01-16 09:29:42'),(5,12,2,NULL,'ngon vãi l*n','2026-01-21 00:46:55');
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (5,1,'2026-01-16 08:25:34'),(5,2,'2026-01-16 04:09:57'),(6,1,'2026-01-16 08:25:29'),(9,2,'2026-01-18 08:40:08'),(10,2,'2026-01-18 08:40:09'),(12,2,'2026-01-21 01:15:45');
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_media`
--

DROP TABLE IF EXISTS `post_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `media_type` enum('image','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `duration_sec` int DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `post_media_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_media`
--

LOCK TABLES `post_media` WRITE;
/*!40000 ALTER TABLE `post_media` DISABLE KEYS */;
INSERT INTO `post_media` VALUES (1,5,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768536338409-0844c12c60513ff8.jpg',NULL,NULL,NULL,0,'2026-01-16 04:05:39'),(2,6,'video','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768536608115-ed75d588f824590e.mp4',NULL,NULL,NULL,0,'2026-01-16 04:10:09'),(3,13,'video','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768957968829-b59b06915d27ede6.mp4',NULL,NULL,NULL,0,'2026-01-21 01:12:57');
/*!40000 ALTER TABLE `post_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` tinyint DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NOT NULL DEFAULT '1',
  `type` enum('status','review') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'status',
  `restaurant_id` int DEFAULT NULL,
  `visibility` enum('public','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  PRIMARY KEY (`id`),
  KEY `fk_posts_user` (`user_id`),
  KEY `fk_posts_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_posts_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (4,NULL,NULL,'ok',NULL,'pending','2026-01-16 04:05:31',2,'status',NULL,'public'),(5,NULL,NULL,'lz',NULL,'pending','2026-01-16 04:05:39',2,'status',NULL,'public'),(6,NULL,NULL,'e gái xinh tươi',NULL,'pending','2026-01-16 04:10:09',2,'status',NULL,'public'),(7,NULL,NULL,'ok',NULL,'approved','2026-01-16 09:32:21',2,'status',NULL,'public'),(8,NULL,NULL,'ok',NULL,'approved','2026-01-16 09:32:38',2,'status',NULL,'public'),(9,NULL,NULL,'okok',NULL,'approved','2026-01-16 09:32:40',2,'status',NULL,'public'),(10,NULL,NULL,'ok',NULL,'approved','2026-01-16 09:32:45',2,'status',NULL,'public'),(11,NULL,NULL,'con c*c',NULL,'approved','2026-01-20 09:14:57',2,'status',NULL,'public'),(12,NULL,NULL,'alo',NULL,'approved','2026-01-21 00:42:59',3,'status',NULL,'public'),(13,NULL,NULL,'vu to vl e',NULL,'approved','2026-01-21 01:12:57',2,'status',NULL,'hidden'),(14,NULL,NULL,'ok',NULL,'approved','2026-01-21 01:23:47',2,'status',NULL,'public');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_banners`
--

DROP TABLE IF EXISTS `restaurant_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ti?u ?? banner (VD: "Gi?m 20% h?m nay")',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'M? t? chi ti?t',
  `banner_type` enum('promotion','booking') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'promotion' COMMENT 'Lo?i: khuy?n m?i ho?c nh?n booking',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '?nh banner',
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Link khi click (c? th? l? link ??n trang qu?n ho?c booking)',
  `start_date` datetime DEFAULT NULL COMMENT 'Ng?y b?t ??u hi?n th?',
  `end_date` datetime DEFAULT NULL COMMENT 'Ng?y k?t th?c hi?n th?',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Tr?ng th?i active',
  `sort_order` int DEFAULT '0' COMMENT 'Th? t? hi?n th? (s? nh? h?n hi?n th? tr??c)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_banners_restaurant` (`restaurant_id`),
  KEY `idx_banner_type` (`banner_type`),
  KEY `idx_active_dates` (`is_active`,`start_date`,`end_date`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_banners_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_banners`
--

LOCK TABLES `restaurant_banners` WRITE;
/*!40000 ALTER TABLE `restaurant_banners` DISABLE KEYS */;
INSERT INTO `restaurant_banners` VALUES (1,NULL,'Muatim.vn tài trợ chương trình này','Muatim.vn tài trợ chương trình này','promotion','https://muatim.vn/assets/storage/images/logo_dark_UJ4.png','https://muatim.vn/','2026-01-18 06:09:00','2026-01-31 06:09:00',1,1,'2026-01-18 06:14:47','2026-01-18 06:15:22');
/*!40000 ALTER TABLE `restaurant_banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_reviews`
--

DROP TABLE IF EXISTS `restaurant_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` tinyint NOT NULL,
  `price_rating` tinyint DEFAULT NULL,
  `food_rating` tinyint DEFAULT NULL,
  `hygiene_rating` tinyint DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_restaurant_review` (`restaurant_id`,`user_id`),
  KEY `fk_restaurant_reviews_restaurant` (`restaurant_id`),
  KEY `fk_restaurant_reviews_user` (`user_id`),
  CONSTRAINT `fk_restaurant_reviews_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_restaurant_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_reviews`
--

LOCK TABLES `restaurant_reviews` WRITE;
/*!40000 ALTER TABLE `restaurant_reviews` DISABLE KEYS */;
INSERT INTO `restaurant_reviews` VALUES (2,5,2,4,5,3,4,'approved','ngon vãi loz','2026-01-16 04:06:17','2026-01-16 09:23:09'),(3,2,2,5,5,5,5,'approved','Ngon vãi l*n','2026-01-16 08:24:31','2026-01-16 09:22:57');
/*!40000 ALTER TABLE `restaurant_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurants`
--

DROP TABLE IF EXISTS `restaurants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_range` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `meal_time` enum('sang','trua','toi','vat','henho','all') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `avg_rating` decimal(3,2) DEFAULT NULL,
  `review_count` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurants`
--

LOCK TABLES `restaurants` WRITE;
/*!40000 ALTER TABLE `restaurants` DISABLE KEYS */;
INSERT INTO `restaurants` VALUES (1,'Mì Quảng Bà Lan','Mì Quảng','Hải Châu','30-50k','123 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.06890000,108.22210000,4.50,128,1,'2026-01-16 04:02:34'),(2,'Bánh mì Sơn Trà','Bánh mì','Sơn Trà','Dưới 30k','45 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.08450000,108.23450000,5.00,1,1,'2026-01-16 04:02:34'),(3,'Bún bò Huế','Bún bò','Thanh Khê','30-50k','78 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800','trua',16.05120000,108.19230000,4.60,156,1,'2026-01-16 04:02:34'),(4,'Cơm tấm Cali','Cơm','Hải Châu','50-100k','92 Hải Phòng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.07230000,108.21560000,4.40,87,1,'2026-01-16 04:02:34'),(5,'Bánh canh cá lóc','Bánh canh','Liên Chiểu','30-50k','56 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.08970000,108.24560000,4.00,1,1,'2026-01-16 04:02:34'),(6,'Chè Thái Lan','Chè','Ngũ Hành Sơn','Dưới 30k','34 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.04010000,108.17890000,4.10,112,1,'2026-01-16 04:02:34'),(7,'Lẩu Thái','Lẩu','Hải Châu','100-200k','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.06540000,108.20870000,4.70,203,1,'2026-01-16 04:02:34'),(8,'Nhà hàng hải sản','Hải sản','Sơn Trà','200k+','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.09120000,108.22780000,4.80,189,1,'2026-01-16 04:02:34'),(9,'Cafe sách','Cafe','Hải Châu','50-100k','67 Hoàng Diệu, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','all',16.07450000,108.21340000,4.50,145,1,'2026-01-16 04:02:34'),(10,'Bánh tráng cuốn Trần','Bánh tráng','Thanh Khê','30-50k','145 Phan Đăng Lưu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.04890000,108.19870000,4.40,167,1,'2026-01-16 04:02:34'),(11,'Mì Quảng 1A','Mì Quảng','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.06980000,108.22340000,4.30,102,0,'2026-01-16 04:02:34'),(12,'Bánh mì Phượng','Bánh mì','Sơn Trà','Dưới 30k','12 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.08560000,18.23560000,4.20,88,0,'2026-01-16 04:02:34'),(13,'Phở Bắc','Phở','Thanh Khê','30-50k','234 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.05230000,108.19340000,4.60,134,0,'2026-01-16 04:02:34'),(14,'Bánh xèo tôm nhảy','Bánh xèo','Liên Chiểu','50-100k','67 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800','trua',16.09080000,108.24670000,4.50,98,0,'2026-01-16 04:02:34'),(15,'Nem nướng Nha Trang','Nem nướng','Ngũ Hành Sơn','50-100k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.04120000,108.18010000,4.40,115,0,'2026-01-16 04:02:34'),(16,'Quán nướng BBQ','Nướng','Hải Châu','100-200k','156 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06650000,108.20980000,4.70,178,0,'2026-01-16 04:02:34'),(17,'Cơm gà Hội An','Cơm','Sơn Trà','50-100k','178 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','trua',16.09230000,108.22890000,4.30,124,0,'2026-01-16 04:02:34'),(18,'Lẩu bò','Lẩu','Thanh Khê','100-200k','201 Hoàng Diệu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.04980000,108.19980000,4.60,156,0,'2026-01-16 04:02:34'),(19,'Cafe view sông','Cafe','Hải Châu','50-100k','45 Phan Đăng Lưu, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','all',16.07560000,108.21450000,4.50,189,0,'2026-01-16 04:02:34'),(20,'Chè Thái','Chè','Liên Chiểu','Dưới 30k','89 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.09190000,108.24780000,4.10,97,0,'2026-01-16 04:02:34'),(21,'Bún bò 7','Bún bò','Ngũ Hành Sơn','30-50k','34 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800','sang',16.04230000,108.18120000,4.40,108,0,'2026-01-16 04:02:34'),(22,'Mì Quảng Góc Phố','Mì Quảng','Cẩm Lệ','30-50k','123 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.03340000,108.15670000,4.30,92,0,'2026-01-16 04:02:34'),(23,'Bánh mì Đầu Hẻm','Bánh mì','Hải Châu','Dưới 30k','56 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.07090000,108.22450000,4.20,156,0,'2026-01-16 04:02:34'),(24,'Phở Hà Nội','Phở','Sơn Trà','30-50k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.08670000,108.23670000,4.60,142,0,'2026-01-16 04:02:34'),(25,'Cơm tấm Sài Gòn','Cơm','Thanh Khê','50-100k','78 Hải Phòng, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.05340000,108.19450000,4.40,119,0,'2026-01-16 04:02:34'),(26,'Bánh canh tôm','Bánh canh','Liên Chiểu','30-50k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.09290000,108.24890000,4.30,87,0,'2026-01-16 04:02:34'),(27,'Lẩu cá','Lẩu','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.04340000,108.18230000,4.70,165,0,'2026-01-16 04:02:34'),(28,'Quán nướng vỉa hè','Nướng','Hải Châu','100-200k','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06760000,108.21090000,4.60,147,0,'2026-01-16 04:02:34'),(29,'Hải sản tươi sống','Hải sản','Sơn Trà','200k+','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.09340000,108.23010000,4.80,201,0,'2026-01-16 04:02:34'),(30,'Cafe sáng','Cafe','Thanh Khê','50-100k','67 Hoàng Diệu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','sang',16.05090000,108.20090000,4.50,134,0,'2026-01-16 04:02:34'),(31,'Bánh tráng Đà Lạt','Bánh tráng','Liên Chiểu','30-50k','145 Phan Đăng Lưu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.09400000,108.25010000,4.40,112,0,'2026-01-16 04:02:34'),(32,'Mì Quảng 3','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.04450000,108.18340000,4.30,98,0,'2026-01-16 04:02:34'),(33,'Bánh mì Chú Ba','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.03450000,108.15780000,4.20,125,0,'2026-01-16 04:02:34'),(34,'Phở Nam Định','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07200000,108.22560000,4.60,148,0,'2026-01-16 04:02:34'),(35,'Cơm niêu','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.08780000,108.23780000,4.40,103,0,'2026-01-16 04:02:34'),(36,'Bánh canh cua','Bánh canh','Thanh Khê','30-50k','78 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05450000,108.19560000,4.30,89,0,'2026-01-16 04:02:34'),(37,'Lẩu Thái chua cay','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.09510000,108.25120000,4.70,172,0,'2026-01-16 04:02:34'),(38,'Quán nướng ngoài trời','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.04560000,108.18450000,4.60,141,0,'2026-01-16 04:02:34'),(39,'Nhà hàng hải sản 2','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.06870000,108.21200000,4.80,193,0,'2026-01-16 04:02:34'),(40,'Cafe bệt','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','all',16.09450000,108.23120000,4.50,167,0,'2026-01-16 04:02:34'),(41,'Chè đậu xanh','Chè','Thanh Khê','Dưới 30k','67 Hoàng Diệu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05200000,108.20200000,4.10,105,0,'2026-01-16 04:02:34'),(42,'Bánh tráng nướng','Bánh tráng','Liên Chiểu','30-50k','145 Phan Đăng Lưu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.09620000,108.25230000,4.40,118,0,'2026-01-16 04:02:34'),(43,'Mì Quảng 5A','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.04670000,108.18560000,4.30,94,0,'2026-01-16 04:02:34'),(44,'Bánh mì Anh Tùng','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.03560000,108.15890000,4.20,132,0,'2026-01-16 04:02:34'),(45,'Phở 24','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07310000,108.22670000,4.60,154,0,'2026-01-16 04:02:34'),(46,'Cơm tấm sườn nướng','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.08890000,108.23890000,4.40,126,0,'2026-01-16 04:02:34'),(47,'Bánh canh ghẹ','Bánh canh','Thanh Khê','30-50k','78 Hải Phòng, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05560000,108.19670000,4.30,91,0,'2026-01-16 04:02:34'),(48,'Lẩu nấm','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.09730000,108.25340000,4.70,179,0,'2026-01-16 04:02:34'),(49,'Quán nướng Hàn Quốc','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.04780000,108.18670000,4.60,149,0,'2026-01-16 04:02:34'),(50,'Hải sản tươi','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.06980000,108.21310000,4.80,207,0,'2026-01-16 04:02:34'),(51,'Cafe view biển','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','henho',16.09560000,108.23230000,4.60,185,0,'2026-01-16 04:02:34'),(52,'Chè khúc bạch','Chè','Thanh Khê','Dưới 30k','67 Phan Đăng Lưu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05310000,108.20310000,4.10,109,0,'2026-01-16 04:02:34'),(53,'Bánh tráng trộn','Bánh tráng','Liên Chiểu','30-50k','145 Hoàng Diệu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.09840000,108.25450000,4.40,121,0,'2026-01-16 04:02:34'),(54,'Mì Quảng Ven Sông','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.04890000,108.18780000,4.30,96,0,'2026-01-16 04:02:34'),(55,'Bánh mì Gần Chợ','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.03670000,108.16010000,4.20,139,0,'2026-01-16 04:02:34'),(56,'Phở bò tái','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07420000,108.22780000,4.60,162,0,'2026-01-16 04:02:34'),(57,'Cơm bình dân','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.09000000,108.24010000,4.40,115,0,'2026-01-16 04:02:34'),(58,'Bánh canh chả cá','Bánh canh','Thanh Khê','30-50k','78 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05670000,108.19780000,4.30,93,0,'2026-01-16 04:02:34'),(59,'Lẩu dê','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.09950000,108.25560000,4.70,181,0,'2026-01-16 04:02:34'),(60,'Quán nướng Nhật','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05000000,108.18890000,4.60,153,0,'2026-01-16 04:02:34'),(61,'Hải sản biển','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.07090000,108.21420000,4.80,211,0,'2026-01-16 04:02:34'),(62,'Cafe làm việc','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','all',16.09670000,108.23340000,4.50,173,0,'2026-01-16 04:02:34'),(63,'Chè sương sa','Chè','Thanh Khê','Dưới 30k','67 Hoàng Diệu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05420000,108.20420000,4.10,113,0,'2026-01-16 04:02:34'),(64,'Bánh tráng nướng Đà Lạt','Bánh tráng','Liên Chiểu','30-50k','145 Phan Đăng Lưu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.10060000,108.25670000,4.40,124,0,'2026-01-16 04:02:34'),(65,'Mì Quảng 7','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.05110000,108.19000000,4.30,100,0,'2026-01-16 04:02:34'),(66,'Bánh mì Cô Hoa','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.03780000,108.16120000,4.20,146,0,'2026-01-16 04:02:34'),(67,'Phở chín','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07530000,108.22890000,4.60,168,0,'2026-01-16 04:02:34'),(68,'Cơm văn phòng','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.09110000,108.24120000,4.40,128,0,'2026-01-16 04:02:34'),(69,'Bánh canh bò viên','Bánh canh','Thanh Khê','30-50k','78 Hải Phòng, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05780000,108.19890000,4.30,95,0,'2026-01-16 04:02:34'),(70,'Lẩu hải sản','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.10170000,108.25780000,4.70,186,0,'2026-01-16 04:02:34'),(71,'Quán nướng Mỹ','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05220000,108.19110000,4.60,157,0,'2026-01-16 04:02:34'),(72,'Hải sản sống','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.07200000,108.21530000,4.80,215,0,'2026-01-16 04:02:34'),(73,'Cafe hẹn hò','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','henho',16.09780000,108.23450000,4.60,191,0,'2026-01-16 04:02:34'),(74,'Chè thập cẩm','Chè','Thanh Khê','Dưới 30k','67 Phan Đăng Lưu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05530000,108.20530000,4.10,117,0,'2026-01-16 04:02:34'),(75,'Bánh tráng cuốn','Bánh tráng','Liên Chiểu','30-50k','145 Hoàng Diệu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.10280000,108.25890000,4.40,127,0,'2026-01-16 04:02:34'),(76,'Mì Quảng 9','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.05330000,108.19220000,4.30,102,0,'2026-01-16 04:02:34'),(77,'Bánh mì Chị Mai','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.03890000,108.16230000,4.20,153,0,'2026-01-16 04:02:34'),(78,'Phở tái nạm','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07640000,108.23000000,4.60,174,0,'2026-01-16 04:02:34'),(79,'Cơm sườn','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.09220000,108.24230000,4.40,131,0,'2026-01-16 04:02:34'),(80,'Bánh canh tôm chua','Bánh canh','Thanh Khê','30-50k','78 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05890000,108.20000000,4.30,97,0,'2026-01-16 04:02:34'),(81,'Lẩu cua','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.10390000,108.26000000,4.70,188,0,'2026-01-16 04:02:34'),(82,'Quán nướng ngon','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05440000,108.19330000,4.60,161,0,'2026-01-16 04:02:34'),(83,'Hải sản tươi sống 2','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.07310000,108.21640000,4.80,219,0,'2026-01-16 04:02:34'),(84,'Cafe yên tĩnh','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','all',16.09890000,108.23560000,4.50,179,0,'2026-01-16 04:02:34'),(85,'Chè bưởi','Chè','Thanh Khê','Dưới 30k','67 Hoàng Diệu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05640000,108.20640000,4.10,121,0,'2026-01-16 04:02:34'),(86,'Bánh tráng cuốn Bà Lan','Bánh tráng','Liên Chiểu','30-50k','145 Phan Đăng Lưu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.10500000,108.26110000,4.40,130,0,'2026-01-16 04:02:34'),(87,'Mì Quảng 10','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.05550000,108.19440000,4.30,104,0,'2026-01-16 04:02:34'),(88,'Bánh mì Bác Nam','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.04000000,108.16340000,4.20,160,0,'2026-01-16 04:02:34'),(89,'Phở bò kho','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07750000,108.23110000,4.60,180,0,'2026-01-16 04:02:34'),(90,'Cơm gà xối mỡ','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.09330000,108.24340000,4.40,134,0,'2026-01-16 04:02:34'),(91,'Bánh canh tôm cua','Bánh canh','Thanh Khê','30-50k','78 Hải Phòng, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06000000,108.20110000,4.30,99,0,'2026-01-16 04:02:34'),(92,'Lẩu riêu cua','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.10610000,108.26220000,4.70,193,0,'2026-01-16 04:02:34'),(93,'Quán nướng BBQ 2','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05660000,108.19550000,4.60,165,0,'2026-01-16 04:02:34'),(94,'Hải sản view biển','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.07420000,108.21750000,4.80,223,0,'2026-01-16 04:02:34'),(95,'Cafe lãng mạn','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','henho',16.10000000,108.23670000,4.70,197,0,'2026-01-16 04:02:34'),(96,'Chè đậu đỏ','Chè','Thanh Khê','Dưới 30k','67 Phan Đăng Lưu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05750000,108.20750000,4.10,125,0,'2026-01-16 04:02:34'),(97,'Bánh tráng nướng cay','Bánh tráng','Liên Chiểu','30-50k','145 Hoàng Diệu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.10720000,108.26330000,4.40,133,0,'2026-01-16 04:02:34'),(98,'Mì Quảng 15','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.05770000,108.19660000,4.30,106,0,'2026-01-16 04:02:34'),(99,'Bánh mì Dì Nga','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.04110000,108.16450000,4.20,167,0,'2026-01-16 04:02:34'),(100,'Phở gà','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07860000,108.23220000,4.60,186,0,'2026-01-16 04:02:34'),(101,'Cơm niêu gà','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.09440000,108.24450000,4.40,137,0,'2026-01-16 04:02:34'),(102,'Bánh canh chay','Bánh canh','Thanh Khê','30-50k','78 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06110000,108.20220000,4.30,101,0,'2026-01-16 04:02:34'),(103,'Lẩu chua cay','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.10830000,108.26440000,4.70,195,0,'2026-01-16 04:02:34'),(104,'Quán nướng 3','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.05880000,108.19770000,4.60,169,0,'2026-01-16 04:02:34'),(105,'Hải sản buffet','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.07530000,108.21860000,4.80,227,0,'2026-01-16 04:02:34'),(106,'Cafe đọc sách','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','all',16.10110000,108.23780000,4.50,185,0,'2026-01-16 04:02:34'),(107,'Chè chuối','Chè','Thanh Khê','Dưới 30k','67 Hoàng Diệu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05860000,108.20860000,4.10,129,0,'2026-01-16 04:02:34'),(108,'Bánh tráng Anh Đức','Bánh tráng','Liên Chiểu','30-50k','145 Phan Đăng Lưu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.10940000,108.26550000,4.40,136,0,'2026-01-16 04:02:34'),(109,'Mì Quảng 20','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.05990000,108.19880000,4.30,108,0,'2026-01-16 04:02:34'),(110,'Bánh mì Chú Hùng','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.04220000,108.16560000,4.20,174,0,'2026-01-16 04:02:34'),(111,'Phở tái','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.07970000,108.23330000,4.60,192,0,'2026-01-16 04:02:34'),(112,'Cơm bò lúc lắc','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.09550000,108.24560000,4.40,140,0,'2026-01-16 04:02:34'),(113,'Bánh canh tôm thịt','Bánh canh','Thanh Khê','30-50k','78 Hải Phòng, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06220000,108.20330000,4.30,103,0,'2026-01-16 04:02:34'),(114,'Lẩu bò tái','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.11050000,108.26660000,4.70,198,0,'2026-01-16 04:02:34'),(115,'Quán nướng Châu Á','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06100000,108.19990000,4.60,173,0,'2026-01-16 04:02:34'),(116,'Hải sản cao cấp','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.07640000,108.21970000,4.80,231,0,'2026-01-16 04:02:34'),(117,'Cafe làm việc 2','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','all',16.10220000,108.23890000,4.50,191,0,'2026-01-16 04:02:34'),(118,'Chè đậu ván','Chè','Thanh Khê','Dưới 30k','67 Phan Đăng Lưu, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1573804639726-05c1f3c1e0d6?w=800','vat',16.05970000,108.20970000,4.10,133,0,'2026-01-16 04:02:34'),(119,'Bánh tráng Cô Linh','Bánh tráng','Liên Chiểu','30-50k','145 Hoàng Diệu, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800','vat',16.11160000,108.26770000,4.40,139,0,'2026-01-16 04:02:34'),(120,'Mì Quảng 99','Mì Quảng','Ngũ Hành Sơn','30-50k','23 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800','sang',16.06210000,108.20100000,4.30,110,0,'2026-01-16 04:02:34'),(121,'Bánh mì Cuối Phố','Bánh mì','Cẩm Lệ','Dưới 30k','56 Nguyễn Văn Linh, Cẩm Lệ, Đà Nẵng','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800','sang',16.04330000,108.16670000,4.20,181,0,'2026-01-16 04:02:34'),(122,'Phở bò viên','Phở','Hải Châu','30-50k','89 Lê Duẩn, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800','sang',16.08080000,108.23440000,4.60,198,0,'2026-01-16 04:02:34'),(123,'Cơm tấm đặc biệt','Cơm','Sơn Trà','50-100k','234 Trần Phú, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','trua',16.09660000,108.24670000,4.40,143,0,'2026-01-16 04:02:34'),(124,'Bánh canh tôm chua cay','Bánh canh','Thanh Khê','30-50k','78 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06330000,108.20440000,4.30,105,0,'2026-01-16 04:02:34'),(125,'Lẩu nấm chay','Lẩu','Liên Chiểu','100-200k','92 Quang Trung, Liên Chiểu, Đà Nẵng','https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800','toi',16.11270000,108.26880000,4.70,200,0,'2026-01-16 04:02:34'),(126,'Quán nướng đêm','Nướng','Ngũ Hành Sơn','100-200k','45 Trần Cao Vân, Ngũ Hành Sơn, Đà Nẵng','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800','toi',16.06420000,108.20210000,4.60,177,0,'2026-01-16 04:02:34'),(127,'Hải sản nhà hàng','Hải sản','Hải Châu','200k+','189 Lý Tự Trọng, Hải Châu, Đà Nẵng','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800','toi',16.07750000,108.22080000,4.80,235,0,'2026-01-16 04:02:34'),(128,'Cafe date','Cafe','Sơn Trà','50-100k','234 Bạch Đằng, Sơn Trà, Đà Nẵng','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800','henho',16.10330000,108.24000000,4.70,203,0,'2026-01-16 04:02:34');
/*!40000 ALTER TABLE `restaurants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_comments`
--

DROP TABLE IF EXISTS `review_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `user_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_review_comments_review` (`review_id`),
  KEY `fk_review_comments_user` (`user_id`),
  KEY `idx_review_comments_parent` (`parent_id`),
  CONSTRAINT `fk_review_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `review_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_comments_review` FOREIGN KEY (`review_id`) REFERENCES `restaurant_reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_comments`
--

LOCK TABLES `review_comments` WRITE;
/*!40000 ALTER TABLE `review_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_media`
--

DROP TABLE IF EXISTS `review_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `media_type` enum('image','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_review_media_review` (`review_id`),
  CONSTRAINT `fk_review_media_review` FOREIGN KEY (`review_id`) REFERENCES `restaurant_reviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_media`
--

LOCK TABLES `review_media` WRITE;
/*!40000 ALTER TABLE `review_media` DISABLE KEYS */;
INSERT INTO `review_media` VALUES (1,3,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768551869753-07b0214285c77ce4.png',0,'2026-01-16 08:24:31'),(3,2,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768555380955-d8fc801445587804.jpg',0,'2026-01-16 09:23:02'),(4,2,'video','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/uploads/1768555380956-9f97359b08493421.mp4',1,'2026-01-16 09:23:02');
/*!40000 ALTER TABLE `review_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_follows`
--

DROP TABLE IF EXISTS `user_follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_follows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `follower_id` int NOT NULL,
  `following_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  KEY `fk_follower` (`follower_id`),
  KEY `fk_following` (`following_id`),
  CONSTRAINT `fk_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `check_not_self` CHECK ((`follower_id` <> `following_id`))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_follows`
--

LOCK TABLES `user_follows` WRITE;
/*!40000 ALTER TABLE `user_follows` DISABLE KEYS */;
INSERT INTO `user_follows` VALUES (1,2,1,'2026-01-16 04:10:36');
/*!40000 ALTER TABLE `user_follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@foodbook.com','$2b$10$v2N5QB/UOmMre.MHfPgALe2TAmHO/k.6DKf5621AUDS1p96KZGOX.','admin',0,NULL,NULL,'2026-01-16 04:01:05'),(2,'Hồ Phạm Đăng Nhân','hophamdangnhan@gg.com','$2b$10$mOb11rAmLv7U7Jagjb9uvuantRrLAyyS6aryoNbb7gIHn4/2RJ7EO','admin',0,'https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/avatars/1768536616604-566dfe94b4dd4638.jpg','Nhân vip cần e gái bao nuôi','2026-01-16 04:05:24'),(3,'Nguyễn Văn Vip','vipvannguyen@gg.com','$2b$10$A9ckGMTSeRm1GdjZehzqpOVDgQtCfdDT4I/UY0G4apFWzsLAsPBIq','user',0,NULL,NULL,'2026-01-21 00:42:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-21  8:37:16
