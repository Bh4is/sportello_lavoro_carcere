
-- migrate:up

-- =====================================================
-- Sportello Lavoro Carcere
-- Note individuali per i documenti dei detenuti
-- =====================================================

ALTER TABLE documenti_detenuti
    ADD COLUMN note TEXT DEFAULT NULL
    AFTER stato;


-- migrate:down

-- Rollback intenzionalmente disabilitato.
-- La rimozione della colonna comporterebbe
-- la perdita delle note già registrate.
