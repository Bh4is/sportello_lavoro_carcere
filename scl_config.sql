/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: scl
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB-5ubuntu0.1 from Ubuntu

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

--
-- Dumping data for table `tipologie_servizio`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `tipologie_servizio` WRITE;
/*!40000 ALTER TABLE `tipologie_servizio` DISABLE KEYS */;
INSERT INTO `tipologie_servizio` VALUES
(1,'PAL',NULL),
(2,'Individuazione e Validazione',NULL),
(3,'Accompagnamento',NULL),
(4,'Seminari e Laboratori',NULL),
(5,'Tutoraggio Tirocini',NULL),
(6,'Attivazione Tirocinio',NULL),
(7,'Servizi D/O',NULL);
/*!40000 ALTER TABLE `tipologie_servizio` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Dumping data for table `codici_servizio`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `codici_servizio` WRITE;
/*!40000 ALTER TABLE `codici_servizio` DISABLE KEYS */;
INSERT INTO `codici_servizio` VALUES
('A3',1,'Orientamento 1° livello (presa in carico)',4.00,50.00,'Individuale','A processo','La presa in carico avviene con almeno 1 ora di A3. Allegare il CV aggiornato.'),
('A4',1,'Orientamento specialistico di 2° livello',10.00,50.00,'Individuale / Piccoli gruppi (3 persone)','A processo','Servizi di PAL: presa in carico tramite A3. Allegare il CV aggiornato.'),
('A4.1',2,'Individuazione competenze',12.00,50.00,'Individuale','A processo','Massimo 12 ore complessive con A4.2: 4 ore individuazione e 8 ore validazione. Allegare il Dossier del cittadino.'),
('A4.2',2,'Validazione competenze',12.00,50.00,'Individuale','A processo','Massimo 12 ore complessive con A4.1: 4 ore individuazione e 8 ore validazione. Allegare il Dossier del cittadino.'),
('A4.7',4,'Seminari e Laboratori (orientamento specialistico)',30.00,50.00,'Individuale / Piccoli gruppi (3 persone)','A processo','Durata massima 30 ore, di cui il 50% in assenza del destinatario.'),
('A5',3,'Accompagnamento al lavoro (LEP F1)',20.00,50.00,'Individuale / Piccoli gruppi (3 persone)','A processo','Aprire il PAI Accompagnamento al lavoro solo dopo la chiusura del PAI Servizi di PAL.'),
('A5.2',5,'Tutoraggio tirocini',16.00,50.00,'Individuale','A processo','Aprire il PAI entro 1 mese dall’avvio del tirocinio e chiuderlo alla conclusione, comunque entro 6 mesi dall’apertura. Associare la COB. Può coesistere con il PAI Attivazione Tirocinio.'),
('A5.2L',6,'Attivazione Tirocinio',NULL,NULL,'Individuale','A risultato','Associare la COB. Tirocinio previsto di almeno 3 mesi e almeno 20 ore settimanali. Ammissibile se dura almeno 1 mese; altrimenti chiudere come non rendicontabile.'),
('A6',7,'Incrocio domanda/offerta di lavoro',NULL,NULL,'Individuale','A risultato','Aprire il PAI e prenotare i servizi entro l’inizio del contratto. Associare la COB. Il contratto deve essere ancora attivo dopo 1 mese, altrimenti chiudere come non rendicontabile. Per somma di contratti si applicano le regole dei 6 mesi.');
/*!40000 ALTER TABLE `codici_servizio` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-11-07 13:02:31
