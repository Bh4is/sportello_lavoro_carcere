/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;
DROP TABLE IF EXISTS `attivita_servizio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `attivita_servizio` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `detenuto_id` int(10) unsigned NOT NULL,
  `codice_servizio` varchar(10) NOT NULL,
  `tipo_attivita` enum('colloquio','back_office') NOT NULL DEFAULT 'colloquio',
  `data_attivita` date DEFAULT NULL,
  `durata_minuti` int(10) unsigned NOT NULL,
  `descrizione` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_colloqui_detenuto` (`detenuto_id`),
  KEY `fk_colloqui_servizio` (`codice_servizio`),
  CONSTRAINT `fk_colloqui_detenuto` FOREIGN KEY (`detenuto_id`) REFERENCES `detenuti` (`id`),
  CONSTRAINT `fk_colloqui_servizio` FOREIGN KEY (`codice_servizio`) REFERENCES `codici_servizio` (`codice`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `codici_servizio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `codici_servizio` (
  `codice` varchar(10) NOT NULL,
  `tipologia_id` int(10) unsigned NOT NULL,
  `nome` varchar(255) NOT NULL,
  `durata_max_ore` decimal(5,2) DEFAULT NULL,
  `percentuale_assenza_max` decimal(5,2) DEFAULT NULL,
  `modalita_erogazione` varchar(100) DEFAULT NULL,
  `riconoscimento_spesa` varchar(50) DEFAULT NULL,
  `regole_pai` text DEFAULT NULL,
  PRIMARY KEY (`codice`),
  KEY `fk_codici_tipologia` (`tipologia_id`),
  CONSTRAINT `fk_codici_tipologia` FOREIGN KEY (`tipologia_id`) REFERENCES `tipologie_servizio` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `colloqui_detenuti`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `colloqui_detenuti` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `detenuto_id` int(10) unsigned NOT NULL,
  `data_colloquio` date NOT NULL,
  `contenuto` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_colloqui_detenuto_data` (`detenuto_id`,`data_colloquio`),
  CONSTRAINT `fk_colloqui_storico_detenuto` FOREIGN KEY (`detenuto_id`) REFERENCES `detenuti` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `detenuti`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detenuti` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) DEFAULT NULL,
  `cognome` varchar(100) DEFAULT NULL,
  `data_nascita` date DEFAULT NULL,
  `data_primo_colloquio` date DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `documenti_detenuti`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `documenti_detenuti` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `detenuto_id` int(10) unsigned NOT NULL,
  `documento_id` int(10) unsigned NOT NULL,
  `stato` enum('si','no','in_corso') DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_documento_detenuto` (`detenuto_id`,`documento_id`),
  KEY `fk_documenti_tipologia` (`documento_id`),
  CONSTRAINT `fk_documenti_detenuto` FOREIGN KEY (`detenuto_id`) REFERENCES `detenuti` (`id`),
  CONSTRAINT `fk_documenti_tipologia` FOREIGN KEY (`documento_id`) REFERENCES `tipologie_documenti` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `riepilogo_ore`;
/*!50001 DROP VIEW IF EXISTS `riepilogo_ore`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `riepilogo_ore` AS SELECT
 1 AS `detenuto_id`,
  1 AS `detenuto`,
  1 AS `codice`,
  1 AS `servizio`,
  1 AS `tipologia`,
  1 AS `minuti_colloquio`,
  1 AS `minuti_back_office`,
  1 AS `minuti_totali`,
  1 AS `data_primo_colloquio` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `riepilogo_ore_mensili`;
/*!50001 DROP VIEW IF EXISTS `riepilogo_ore_mensili`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `riepilogo_ore_mensili` AS SELECT
 1 AS `anno`,
  1 AS `mese`,
  1 AS `minuti_colloquio`,
  1 AS `minuti_back_office`,
  1 AS `minuti_totali` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `tipologie_documenti`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipologie_documenti` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `descrizione` text DEFAULT NULL,
  `attivo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipologie_documenti_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tipologie_servizio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipologie_servizio` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `descrizione` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `riepilogo_ore`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_uca1400_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`scl_app`@`localhost` SQL SECURITY INVOKER */
/*!50001 VIEW `riepilogo_ore` AS select `d`.`id` AS `detenuto_id`,concat_ws(' ',`d`.`cognome`,`d`.`nome`) AS `detenuto`,`s`.`codice` AS `codice`,`s`.`nome` AS `servizio`,`t`.`nome` AS `tipologia`,coalesce(sum(case when `a`.`tipo_attivita` = 'colloquio' then `a`.`durata_minuti` else 0 end),0) AS `minuti_colloquio`,coalesce(sum(case when `a`.`tipo_attivita` = 'back_office' then `a`.`durata_minuti` else 0 end),0) AS `minuti_back_office`,coalesce(sum(`a`.`durata_minuti`),0) AS `minuti_totali`,`d`.`data_primo_colloquio` AS `data_primo_colloquio` from (((`detenuti` `d` join `codici_servizio` `s`) join `tipologie_servizio` `t` on(`t`.`id` = `s`.`tipologia_id`)) left join `attivita_servizio` `a` on(`a`.`detenuto_id` = `d`.`id` and `a`.`codice_servizio` = `s`.`codice`)) group by `d`.`id`,`d`.`cognome`,`d`.`nome`,`s`.`codice`,`s`.`nome`,`t`.`nome`,`d`.`data_primo_colloquio` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `riepilogo_ore_mensili`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_uca1400_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`scl_app`@`localhost` SQL SECURITY INVOKER */
/*!50001 VIEW `riepilogo_ore_mensili` AS select year(`attivita_servizio`.`data_attivita`) AS `anno`,month(`attivita_servizio`.`data_attivita`) AS `mese`,sum(case when `attivita_servizio`.`tipo_attivita` = 'colloquio' then `attivita_servizio`.`durata_minuti` else 0 end) AS `minuti_colloquio`,sum(case when `attivita_servizio`.`tipo_attivita` = 'back_office' then `attivita_servizio`.`durata_minuti` else 0 end) AS `minuti_back_office`,sum(`attivita_servizio`.`durata_minuti`) AS `minuti_totali` from `attivita_servizio` where `attivita_servizio`.`data_attivita` is not null group by year(`attivita_servizio`.`data_attivita`),month(`attivita_servizio`.`data_attivita`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

