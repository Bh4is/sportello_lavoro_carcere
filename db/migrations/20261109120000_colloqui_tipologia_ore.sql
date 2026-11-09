
-- migrate:up transaction:false

-- =====================================================
-- Sportello Lavoro Carcere
-- Collegamento colloqui e rendicontazione ore
-- =====================================================

-- Tipologia di servizio associata al colloquio.

ALTER TABLE colloqui_detenuti
    ADD COLUMN codice_servizio VARCHAR(10) NULL
        AFTER data_colloquio,

    ADD KEY idx_colloqui_codice_servizio (
        codice_servizio
    ),

    ADD CONSTRAINT fk_colloqui_codice_servizio
        FOREIGN KEY (codice_servizio)
        REFERENCES codici_servizio(codice)
        ON DELETE RESTRICT;


-- Collega le attività rendicontate
-- al relativo colloquio individuale.

ALTER TABLE attivita_servizio
    ADD COLUMN colloquio_id INT UNSIGNED NULL
        AFTER detenuto_id,

    ADD UNIQUE KEY uq_attivita_colloquio_tipo (
        colloquio_id,
        tipo_attivita
    ),

    ADD CONSTRAINT fk_attivita_colloquio
        FOREIGN KEY (colloquio_id)
        REFERENCES colloqui_detenuti(id)
        ON DELETE RESTRICT;


-- migrate:down transaction:false

-- Rollback non automatico.
-- La rimozione dei campi potrebbe comportare
-- la perdita di informazioni già registrate.
