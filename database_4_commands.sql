-- 4 Belangrijkste SQL Commands voor Manege Systeem
-- Voor Supabase PostgreSQL

-- 1. Members (Leden/Klanten) Tabel
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('Actief', 'Wachtlijst', 'Inactief')) DEFAULT 'Actief',
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Calendar Events (Planning/Lessen) Tabel
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    color VARCHAR(20) CHECK (color IN ('blue', 'teal', 'orange', 'red', 'green')) DEFAULT 'blue',
    type VARCHAR(50),
    instructor VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Consumptie Kaarten Tabel
CREATE TABLE IF NOT EXISTS consumptie_kaarten (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    klant_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    datum DATE NOT NULL,
    totaal_bedrag DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(30) CHECK (status IN ('open', 'klaar_voor_facturatie', 'betaalverzoek_verstuurd', 'betaald')) DEFAULT 'open',
    mollie_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transactions (Transacties) Tabel
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Factuur', 'Betaling', 'Incasso')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Open', 'Betaald', 'Verwerkt')) DEFAULT 'Open',
    mollie_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

