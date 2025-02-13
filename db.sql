-- -----------------------------------------------------
-- Table sonamedic.p_patienten
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS p_patienten (
  p_id SERIAL PRIMARY KEY,
  p_vorname VARCHAR(45) NULL,
  p_nachname VARCHAR(45) NULL,
  p_email VARCHAR(100),
  p_telefonnummer VARCHAR(20) NULL,
  p_geburtsdatum DATE NULL,
  p_svnr VARCHAR(10) NULL,
  p_allergien TEXT,
  p_vorerkrankungen TEXT,
  p_medikamente TEXT,
  p_geschlecht SMALLINT NULL,
  p_stammdaten JSON,
  p_ist_patient SMALLINT NULL,
  p_datenschutzerklärung SMALLINT NULL
);

-- -----------------------------------------------------
-- Table sonamedic.reintonaudiometrie
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reintonaudiometrie (
  rt_id SERIAL PRIMARY KEY,  -- Eindeutige ID für jede Zeile (Frequenz/Ohr-Kombination)
  rt_test_id BIGINT NOT NULL,  -- Übergeordnete Test-ID (z. B. 1 für den ersten Test des Patienten)
  rt_datum DATE NOT NULL,  -- Datum des Tests
  rt_startzeit TIMESTAMP NOT NULL,  -- Startzeit des Tests
  rt_endzeit TIMESTAMP NOT NULL,  -- Endzeit des Tests
  rt_p_id INT NOT NULL REFERENCES p_patienten(p_id) ON DELETE CASCADE,  -- Fremdschlüssel zum Patienten
  rt_frequenz INT NOT NULL,  -- Frequenz in Hz (125, 250, ..., 14000)
  rt_ohr VARCHAR(10) NOT NULL,  -- Getestetes Ohr ("left", "right", "binaural")
  rt_lautstaerke_db DECIMAL(5,2) NOT NULL,  -- Lautstärke in dB
  rt_gehoert BOOLEAN NOT NULL  -- Wurde der Ton gehört? (true/false)
);

-- -----------------------------------------------------
-- Table sonamedic.u_userverwaltung
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS u_userverwaltung (
  u_id SERIAL PRIMARY KEY,
  u_username VARCHAR(45) NULL,
  u_passwort VARCHAR(100) NULL,
  u_email VARCHAR(80) NULL,
  u_verified BOOLEAN,
  u_verification_token VARCHAR(255),
  u_resetpasswordtoken VARCHAR(255),
  u_resetpasswordexpires TIMESTAMP WITHOUT TIME ZONE,
  u_p_id INT NULL REFERENCES p_patienten(p_id) ON DELETE SET NULL ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table sonamedic.l_logging
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS l_logging (
  l_id SERIAL PRIMARY KEY,
  l_event_typ VARCHAR(255) NULL,
  l_timestamp TIMESTAMP NULL
);

-- -----------------------------------------------------
-- Table sonamedic.tt_termintyp
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tt_termintyp (
  tt_id SERIAL PRIMARY KEY,
  tt_bezeichnung VARCHAR(45) NULL
);

-- -----------------------------------------------------
-- Table sonamedic.z_zeitslots
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS z_zeitslots (
  z_id SERIAL PRIMARY KEY,
  z_startzeit TIME NULL,
  z_endzeit VARCHAR(45) NULL,
  z_datum DATE NOT NULL
);

-- -----------------------------------------------------
-- Table sonamedic.t_termine
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS t_termine (
  t_id SERIAL PRIMARY KEY,
  t_termintyp VARCHAR(45) NULL,
  t_p_id INT NOT NULL,
  tt_termintyp_tt_id INT NOT NULL,
  z_zeitslots_z_id INT NOT NULL,
  CONSTRAINT fk_t_termine_p_patienten1 FOREIGN KEY (t_p_id)
    REFERENCES p_patienten (p_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_t_termine_tt_termintyp1 FOREIGN KEY (tt_termintyp_tt_id)
    REFERENCES tt_termintyp (tt_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_t_termine_z_zeitslots1 FOREIGN KEY (z_zeitslots_z_id)
    REFERENCES z_zeitslots (z_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table sonamedic.h_hoertest
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS h_hoertest (
  h_id SERIAL PRIMARY KEY,
  h_testname VARCHAR(45) NULL,
  h_beschreibung TEXT NULL,
  h_kategorie VARCHAR(45) NULL,
  h_erstellt_am TIMESTAMP NULL
);

-- -----------------------------------------------------
-- Table sonamedic.b_benachrichtigungen
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS b_benachrichtigungen (
  b_id SERIAL PRIMARY KEY,
  b_nachricht TEXT NULL,
  b_date TIMESTAMP NULL
);

-- -----------------------------------------------------
-- Table sonamedic.sin_speech_in_noise_test
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS sin_speech_in_noise_test (
  sin_id SERIAL PRIMARY KEY,
  sin_datum DATE NULL,
  sin_startzeit TIMESTAMP NULL,
  sin_endzeit TIMESTAMP NULL,
  sin_ergebnis DECIMAL(5,2) NULL,
  sin_p_id INT NOT NULL,
  CONSTRAINT fk_sin_speech_in_noise_test_p_patienten1 FOREIGN KEY (sin_p_id)
    REFERENCES p_patienten (p_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table sonamedic.sine_ergebnisse
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS sine_ergebnisse (
  ergebnis_id SERIAL PRIMARY KEY,
  sine_richtigeAntworten INT NULL,
  sine_falscheAntworten INT NULL,
  sine_sin_id INT NOT NULL,
  CONSTRAINT fk_sine_ergebnisse_sin_speech_in_noise_test1 FOREIGN KEY (sine_sin_id)
    REFERENCES sin_speech_in_noise_test (sin_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table sonamedic.e_ergebnisse
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS e_ergebnisse (
  e_id SERIAL PRIMARY KEY,
  e_ergebnisse VARCHAR(255) NULL,
  e_datum DATE NULL,
  e_veraenderung DECIMAL(5,2) NULL,
  e_p_id INT NOT NULL,
  e_h_id INT NOT NULL,
  e_b_id INT NOT NULL,
  e_sine_id INT NOT NULL,
  CONSTRAINT fk_e_ergebnisse_p_patienten1 FOREIGN KEY (e_p_id)
    REFERENCES p_patienten (p_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_e_ergebnisse_h_hoertest1 FOREIGN KEY (e_h_id)
    REFERENCES h_hoertest (h_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_e_ergebnisse_b_benachrichtigungen1 FOREIGN KEY (e_b_id)
    REFERENCES b_benachrichtigungen (b_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_e_ergebnisse_sine_ergebnisse1 FOREIGN KEY (e_sine_id)
    REFERENCES sine_ergebnisse (ergebnis_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table sonamedic.pl_p_has_l
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pl_p_has_l (
  pl_p_id INT NOT NULL,
  pl_l_id INT NOT NULL,
  PRIMARY KEY (pl_p_id, pl_l_id),
  CONSTRAINT fk_p_patienten_has_l_logging_p_patienten1 FOREIGN KEY (pl_p_id)
    REFERENCES p_patienten (p_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_p_patienten_has_l_logging_l_logging1 FOREIGN KEY (pl_l_id)
    REFERENCES l_logging (l_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table sonamedic.pb_p_hat_b
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pb_p_hat_b (
  pb_p_id INT NOT NULL,
  pb_b_id INT NOT NULL,
  PRIMARY KEY (pb_p_id, pb_b_id),
  CONSTRAINT fk_p_patienten_has_b_benachrichtigungen_p_patienten1 FOREIGN KEY (pb_p_id)
    REFERENCES p_patienten (p_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_p_patienten_has_b_benachrichtigungen_b_benachrichtigungen1 FOREIGN KEY (pb_b_id)
    REFERENCES b_benachrichtigungen (b_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table sonamedic.sinf_frage
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS sinf_frage (
  sinf_id SERIAL PRIMARY KEY,
  sinf_frage VARCHAR(255) NULL,
  sinf_erwarteteAntwort VARCHAR(255) NULL,
  sinf_hintergrundlautstaerke DECIMAL(5,2) NULL,
  sinf_soundlautstaerke DECIMAL(5,2) NULL,
  sinf_sin_id INT NOT NULL,
  CONSTRAINT fk_sinf_frage_sin_speech_in_noise_test1 FOREIGN KEY (sinf_sin_id)
    REFERENCES sin_speech_in_noise_test (sin_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table sonamedic.sina_antwort
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS sina_antwort (
  sina_id SERIAL PRIMARY KEY,
  sina_antwort TEXT NULL,
  sina_ist_korrekt SMALLINT NULL,
  sina_sinf_id INT NOT NULL,
  sina_p_id INT NOT NULL,
  CONSTRAINT fk_sina_antwort_sinf_frage1 FOREIGN KEY (sina_sinf_id)
    REFERENCES sinf_frage (sinf_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_sina_antwort_p_patienten1 FOREIGN KEY (sina_p_id)
    REFERENCES p_patienten (p_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

--------------------

INSERT INTO tt_termintyp (tt_id, tt_bezeichnung) VALUES
(1, 'Hörtest und Beratung'),
(2, 'Beratung Gehörschutz'),
(3, 'Routineuntersuchung');
