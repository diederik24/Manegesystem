-- Maak API key voor Elvira Straver
-- Dit script zoekt Elvira op en maakt een API key aan

DO $$
DECLARE
    v_member_id UUID;
    v_api_key TEXT;
    v_existing_key_id UUID;
BEGIN
    -- Zoek Elvira Straver
    SELECT id INTO v_member_id
    FROM members
    WHERE name ILIKE '%elvira%straver%'
       OR (name ILIKE '%elvira%' AND name ILIKE '%straver%')
    LIMIT 1;

    -- Check of klant gevonden is
    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Klant Elvira Straver niet gevonden in de database';
    END IF;

    -- Check of er al een actieve API key bestaat
    SELECT id INTO v_existing_key_id
    FROM api_keys
    WHERE member_id = v_member_id
      AND is_active = true;

    -- Als er al een actieve key is, deactiveer deze eerst
    IF v_existing_key_id IS NOT NULL THEN
        UPDATE api_keys
        SET is_active = false
        WHERE id = v_existing_key_id;
        
        RAISE NOTICE 'Bestaande API key gedeactiveerd';
    END IF;

    -- Genereer nieuwe API key
    -- Format: mk_ + base64 encoded random bytes (32 bytes = 44 chars base64)
    -- Vervang URL-unsafe karakters
    v_api_key := 'mk_' || replace(
        replace(
            replace(
                encode(gen_random_bytes(32), 'base64'),
                '+', '-'
            ),
            '/', '_'
        ),
        '=', ''
    );

    -- Voeg API key toe aan database
    INSERT INTO api_keys (member_id, api_key, is_active, notes)
    VALUES (
        v_member_id,
        v_api_key,
        true,
        'Aangemaakt voor Elvira Straver'
    );

    -- Toon resultaat
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ API Key succesvol aangemaakt voor Elvira Straver!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'API Key: %', v_api_key;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- Selecteer ook de klant info voor bevestiging
    PERFORM name, email FROM members WHERE id = v_member_id;

END $$;

-- Toon de aangemaakte key en klant info
SELECT 
    m.name as klant_naam,
    m.email as klant_email,
    ak.api_key,
    ak.is_active,
    ak.created_at
FROM api_keys ak
JOIN members m ON ak.member_id = m.id
WHERE m.name ILIKE '%elvira%straver%'
   OR (m.name ILIKE '%elvira%' AND m.name ILIKE '%straver%')
ORDER BY ak.created_at DESC
LIMIT 1;

