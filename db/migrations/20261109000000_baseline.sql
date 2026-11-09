
-- migrate:up

-- =========================================================
-- Sportello Lavoro Carcere
-- Baseline dello schema MariaDB - 09/11/2026
-- =========================================================

-- 1. Tipologie di servizio

CREATE TABLE tipologie_servizio (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descrizione TEXT DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 2. Codici di servizio

CREATE TABLE codici_servizio (
    codice VARCHAR(10) NOT NULL,
    tipologia_id INT UNSIGNED NOT NULL,
    nome VARCHAR(255) NOT NULL,
    durata_max_ore DECIMAL(5,2) DEFAULT NULL,
    percentuale_assenza_max DECIMAL(5,2) DEFAULT NULL,
    modalita_erogazione VARCHAR(100) DEFAULT NULL,
    riconoscimento_spesa VARCHAR(50) DEFAULT NULL,
    regole_pai TEXT DEFAULT NULL,

    PRIMARY KEY (codice),

    KEY fk_codici_tipologia (tipologia_id),

    CONSTRAINT fk_codici_tipologia
        FOREIGN KEY (tipologia_id)
        REFERENCES tipologie_servizio(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 3. Anagrafica detenuti

CREATE TABLE detenuti (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) DEFAULT NULL,
    cognome VARCHAR(100) DEFAULT NULL,
    data_nascita DATE DEFAULT NULL,
    data_primo_colloquio DATE DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 4. Attività di servizio e rendicontazione ore

CREATE TABLE attivita_servizio (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    detenuto_id INT UNSIGNED NOT NULL,
    codice_servizio VARCHAR(10) NOT NULL,
    tipo_attivita ENUM('colloquio', 'back_office')
        NOT NULL DEFAULT 'colloquio',
    data_attivita DATE DEFAULT NULL,
    durata_minuti INT UNSIGNED NOT NULL,
    descrizione TEXT DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY fk_colloqui_detenuto (detenuto_id),
    KEY fk_colloqui_servizio (codice_servizio),

    CONSTRAINT fk_colloqui_detenuto
        FOREIGN KEY (detenuto_id)
        REFERENCES detenuti(id),

    CONSTRAINT fk_colloqui_servizio
        FOREIGN KEY (codice_servizio)
        REFERENCES codici_servizio(codice)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 5. Storico dei colloqui individuali

CREATE TABLE colloqui_detenuti (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    detenuto_id INT UNSIGNED NOT NULL,
    data_colloquio DATE NOT NULL,
    contenuto TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_colloqui_detenuto_data (
        detenuto_id,
        data_colloquio
    ),

    CONSTRAINT fk_colloqui_storico_detenuto
        FOREIGN KEY (detenuto_id)
        REFERENCES detenuti(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 6. Catalogo dei documenti

CREATE TABLE tipologie_documenti (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    descrizione TEXT DEFAULT NULL,
    attivo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_tipologie_documenti_nome (nome)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 7. Checklist documenti per detenuto

CREATE TABLE documenti_detenuti (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    detenuto_id INT UNSIGNED NOT NULL,
    documento_id INT UNSIGNED NOT NULL,
    stato ENUM('si', 'no', 'in_corso') DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_documento_detenuto (
        detenuto_id,
        documento_id
    ),

    KEY fk_documenti_tipologia (documento_id),

    CONSTRAINT fk_documenti_detenuto
        FOREIGN KEY (detenuto_id)
        REFERENCES detenuti(id),

    CONSTRAINT fk_documenti_tipologia
        FOREIGN KEY (documento_id)
        REFERENCES tipologie_documenti(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 8. Vista riepilogativa delle attività

CREATE VIEW riepilogo_ore AS
SELECT
    d.id AS detenuto_id,
    CONCAT_WS(' ', d.cognome, d.nome) AS detenuto,
    s.codice AS codice,
    s.nome AS servizio,
    t.nome AS tipologia,

    COALESCE(
        SUM(
            CASE
                WHEN a.tipo_attivita = 'colloquio'
                THEN a.durata_minuti
                ELSE 0
            END
        ),
        0
    ) AS minuti_colloquio,

    COALESCE(
        SUM(
            CASE
                WHEN a.tipo_attivita = 'back_office'
                THEN a.durata_minuti
                ELSE 0
            END
        ),
        0
    ) AS minuti_back_office,

    COALESCE(SUM(a.durata_minuti), 0) AS minuti_totali,

    d.data_primo_colloquio AS data_primo_colloquio

FROM detenuti AS d

JOIN codici_servizio AS s

JOIN tipologie_servizio AS t
    ON t.id = s.tipologia_id

LEFT JOIN attivita_servizio AS a
    ON a.detenuto_id = d.id
    AND a.codice_servizio = s.codice

GROUP BY
    d.id,
    d.cognome,
    d.nome,
    s.codice,
    s.nome,
    t.nome,
    d.data_primo_colloquio;


-- 9. Vista riepilogativa delle ore mensili

CREATE VIEW riepilogo_ore_mensili AS
SELECT
    YEAR(data_attivita) AS anno,
    MONTH(data_attivita) AS mese,

    SUM(
        CASE
            WHEN tipo_attivita = 'colloquio'
            THEN durata_minuti
            ELSE 0
        END
    ) AS minuti_colloquio,

    SUM(
        CASE
            WHEN tipo_attivita = 'back_office'
            THEN durata_minuti
            ELSE 0
        END
    ) AS minuti_back_office,

    SUM(durata_minuti) AS minuti_totali

FROM attivita_servizio

WHERE data_attivita IS NOT NULL

GROUP BY
    YEAR(data_attivita),
    MONTH(data_attivita);


-- migrate:down

-- Baseline iniziale: rollback intenzionalmente disabilitato.
-- Non eliminiamo tabelle o dati preesistenti.
