-- Manege Management System Database Schema
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

-- 2. Horses (Paarden) Tabel
CREATE TABLE IF NOT EXISTS horses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255),
    birth_date DATE,
    available BOOLEAN DEFAULT true,
    type VARCHAR(20) CHECK (type IN ('Manege', 'Pension')) NOT NULL,
    owner_id UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Calendar Events (Planning/Lessen) Tabel
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

-- 4. Consumptie Kaarten Tabel
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

-- 5. Consumptie Items Tabel
CREATE TABLE IF NOT EXISTS consumptie_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumptie_kaart_id UUID REFERENCES consumptie_kaarten(id) ON DELETE CASCADE NOT NULL,
    naam VARCHAR(255) NOT NULL,
    prijs DECIMAL(10, 2) NOT NULL,
    aantal INTEGER NOT NULL DEFAULT 1,
    totaal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transactions (Transacties) Tabel
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

-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_horses_owner ON horses(owner_id);
CREATE INDEX IF NOT EXISTS idx_horses_available ON horses(available);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_consumptie_kaarten_klant ON consumptie_kaarten(klant_id);
CREATE INDEX IF NOT EXISTS idx_consumptie_kaarten_status ON consumptie_kaarten(status);
CREATE INDEX IF NOT EXISTS idx_consumptie_items_kaart ON consumptie_items(consumptie_kaart_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Function om updated_at automatisch te updaten
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers voor updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horses_updated_at BEFORE UPDATE ON horses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumptie_kaarten_updated_at BEFORE UPDATE ON consumptie_kaarten
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

