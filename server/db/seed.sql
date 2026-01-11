-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: foodbook
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','hophamdangnhandz123@gmail.com','$2b$10$BUGlBOSvCf6SOMAK7nWpZeMOU4tiv6iaQ9P00pye/6mqn88DwM9bS','admin',0,'2026-01-07 02:33:40'),(2,'Hồ Nhân','heklolo@gmail.com','$2b$10$Ma7zRB4KTE4SjjsyKz2Q8emHmsTGJPNAiZ7lr2dVl10OG./lAz9yi','user',0,'2026-01-07 03:57:38'),(3,'Hồ Phạm Đăng Nhân','hophamdangnhan@gg.com','$2b$10$v74DB7ssfJfnvIRYOcgkSu8JemiqsZ/6COeL.ZyFraZpq8cea6v9q','user',0,'2026-01-07 03:58:18'),(4,'Admin','admin@foodbook.com','$2b$10$v2N5QB/UOmMre.MHfPgALe2TAmHO/k.6DKf5621AUDS1p96KZGOX.','admin',0,'2026-01-08 03:00:42'),(5,'Trang','trangok@gg.com','$2b$10$xyPUEwxiDKCjV7HbX.A0UeycEpbd6oU6yr53OnPBG6B7vcxr2gbK.','user',0,'2026-01-08 03:01:05'),(6,'Thái Đức Thành','thaiducthanh@gg.com','$2b$10$adog1GKTEwVqQuLyISjULu8gZlXIrVKSE8txN/ma2X/Ydrwk27ogW','user',0,'2026-01-09 06:01:32');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `restaurants`
--

LOCK TABLES `restaurants` WRITE;
/*!40000 ALTER TABLE `restaurants` DISABLE KEYS */;
INSERT INTO `restaurants` VALUES (1,'Mì Qu?ng 1A','Mì Qu?ng','H?i Châu','30-50k','H?i Phòng, ?à N?ng','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200','2026-01-08 03:57:21'),(2,'Bánh tráng cu?n Tr?n','??c s?n','S?n Trà','50-100k','Lê Du?n, ?à N?ng','https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200','2026-01-08 03:57:21');
/*!40000 ALTER TABLE `restaurants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,NULL,NULL,'hello',NULL,'approved','2026-01-08 07:08:26',1,'status',NULL,'public'),(2,NULL,NULL,'hello danh',NULL,'approved','2026-01-08 07:09:07',3,'status',NULL,'public'),(3,NULL,NULL,'xin chao',NULL,'approved','2026-01-08 07:09:15',3,'status',NULL,'public'),(4,NULL,NULL,'Mình cần tìm baby. https://www.facebook.com/congdanh.tran.961993',NULL,'pending','2026-01-08 07:21:29',3,'status',NULL,'public'),(5,NULL,NULL,'danh ngu',NULL,'pending','2026-01-08 07:27:25',3,'status',NULL,'public'),(6,NULL,NULL,'alo',NULL,'pending','2026-01-08 07:27:29',3,'status',NULL,'public'),(7,NULL,NULL,'Tội nghiệp cho em quá. Chỉ vì quê Thanh Hóa','/uploads/1767857808641-912145799.png','pending','2026-01-08 07:36:48',3,'status',NULL,'public'),(8,NULL,NULL,'hello','/uploads/1767857840941-616250878.png','pending','2026-01-08 07:37:20',3,'status',NULL,'public'),(9,NULL,NULL,'hi',NULL,'pending','2026-01-08 07:41:19',3,'status',NULL,'public'),(10,NULL,NULL,'tran cong danh',NULL,'pending','2026-01-08 07:47:55',3,'status',NULL,'public'),(11,NULL,NULL,'thanh',NULL,'pending','2026-01-09 01:05:48',3,'status',NULL,'public'),(12,NULL,NULL,'con c*c',NULL,'pending','2026-01-09 01:05:54',3,'status',NULL,'public'),(13,NULL,NULL,'** má mày',NULL,'pending','2026-01-09 01:06:01',3,'status',NULL,'public'),(14,NULL,NULL,'đi chơi ko ae','/uploads/1767921454866-989438842.png','pending','2026-01-09 01:17:34',3,'status',NULL,'public'),(15,NULL,NULL,'hellp',NULL,'pending','2026-01-09 01:40:54',3,'status',NULL,'public'),(16,NULL,NULL,'helo','https://pub-4b1a3f397cd0https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev47d6a06588e1695d660a.r2.dev/posts/1767922862445-92b003b90343fe90.png','pending','2026-01-09 01:41:03',3,'status',NULL,'public'),(17,NULL,NULL,'hihi','https://pub-4b1a3f397cd0https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev47d6a06588e1695d660a.r2.dev/posts/1767922994929-a905e18a51d3297b.png','pending','2026-01-09 01:43:15',3,'status',NULL,'public'),(18,NULL,NULL,'hello','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev47d6a06588e1695d660a.r2.dev/posts/1767923037031-79643754c2740ab4.png','pending','2026-01-09 01:43:58',3,'status',NULL,'public'),(19,NULL,NULL,'hello','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/posts/1767923245976-0fd9ad11d2f64584.png','pending','2026-01-09 01:47:27',3,'status',NULL,'public'),(20,NULL,NULL,'xx',NULL,'pending','2026-01-09 02:09:03',3,'status',NULL,'public'),(21,NULL,NULL,'hello',NULL,'pending','2026-01-09 02:09:27',3,'status',NULL,'public'),(22,NULL,NULL,'test',NULL,'pending','2026-01-09 02:10:01',3,'status',NULL,'public'),(23,NULL,5,'ok',NULL,'pending','2026-01-09 02:18:48',3,'review',2,'public'),(24,NULL,NULL,'ok',NULL,'pending','2026-01-09 05:56:30',3,'status',NULL,'public'),(25,NULL,NULL,'Hôm nay mới chia tay người yêu. Có em gái chân dài nào đi chơi với anh ko. Anh khao nhé . Anh đi ô tô :D',NULL,'pending','2026-01-09 06:02:49',6,'status',NULL,'public'),(26,NULL,NULL,'cc',NULL,'pending','2026-01-10 08:30:44',3,'status',NULL,'public'),(27,NULL,NULL,'cc',NULL,'pending','2026-01-10 08:30:53',3,'status',NULL,'public'),(28,NULL,NULL,'ccc',NULL,'pending','2026-01-10 08:31:06',3,'status',NULL,'public'),(29,NULL,NULL,'ok',NULL,'pending','2026-01-10 08:31:16',3,'status',NULL,'public'),(30,NULL,NULL,'ok',NULL,'pending','2026-01-10 08:31:33',3,'status',NULL,'public');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `post_media`
--

LOCK TABLES `post_media` WRITE;
/*!40000 ALTER TABLE `post_media` DISABLE KEYS */;
INSERT INTO `post_media` VALUES (1,20,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/posts/images/1767924542508-9fac4e48e88e4b64-0.png',NULL,NULL,NULL,0,'2026-01-09 02:09:03'),(2,21,'video','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/posts/videos/1767924567211-e27b4c7da6177895-0.mp4',NULL,NULL,NULL,0,'2026-01-09 02:09:27'),(3,22,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/posts/images/1767924600290-4d7e845025a5027c-0.jfif',NULL,NULL,NULL,0,'2026-01-09 02:10:01'),(4,22,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/posts/images/1767924600291-ed320a26f296df37-1.png',NULL,NULL,NULL,1,'2026-01-09 02:10:01'),(5,22,'video','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/posts/videos/1767924600291-297c8c945f7ade25-2.mp4',NULL,NULL,NULL,2,'2026-01-09 02:10:01'),(6,25,'image','https://pub-4b1a3f397cd047d6a06588e1695d660a.r2.dev/posts/images/1767938568987-dcccb3d70778c9b2-0.png',NULL,NULL,NULL,0,'2026-01-09 06:02:49');
/*!40000 ALTER TABLE `post_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (3,3,'2026-01-08 07:12:45'),(4,3,'2026-01-08 07:26:04'),(5,3,'2026-01-08 07:27:32'),(6,3,'2026-01-08 07:27:31'),(22,3,'2026-01-09 07:50:29'),(23,3,'2026-01-09 02:59:41'),(24,3,'2026-01-09 06:05:43'),(25,3,'2026-01-09 07:37:06'),(28,3,'2026-01-10 08:33:53'),(30,3,'2026-01-10 08:33:55');
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
INSERT INTO `post_comments` VALUES (4,25,3,NULL,'Em anh ơi','2026-01-09 06:03:08'),(5,25,3,4,'ok','2026-01-09 07:37:17');
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `comment_media`
--

LOCK TABLES `comment_media` WRITE;
/*!40000 ALTER TABLE `comment_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_media` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-11 15:31:15
