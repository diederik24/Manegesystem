import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'nodejs',
};

// Helper functie om API key te valideren en member_id op te halen
async function validateApiKeyAndGetMemberId(
  supabaseClient: ReturnType<typeof createClient>,
  apiKey: string
): Promise<{ isValid: boolean; memberId?: string }> {
  const { data, error } = await supabaseClient
    .from('api_keys')
    .select('member_id, is_active, expires_at')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) {
    return { isValid: false };
  }

  // Check of key actief is
  if (!data.is_active) {
    return { isValid: false };
  }

  // Check of key niet verlopen is
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { isValid: false };
  }

  // Update last_used_at
  await supabaseClient
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('api_key', apiKey);

  return { isValid: true, memberId: data.member_id };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        code: 'MISSING_ENV_VARS'
      });
    }

    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        code: 'MISSING_API_KEY'
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Validate API key en haal member_id op
    const { isValid, memberId } = await validateApiKeyAndGetMemberId(supabaseClient, apiKey);
    
    if (!isValid || !memberId) {
      return res.status(401).json({ 
        error: 'Invalid or expired API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Fetch customer data
    const { data: memberData, error: memberError } = await supabaseClient
      .from('members')
      .select('id, name, email, phone, status, balance, klant_type, adres, postcode, plaats, factuur_adres, factuur_postcode, factuur_plaats, factuur_email')
      .eq('id', memberId)
      .single();

    if (memberError || !memberData) {
      return res.status(404).json({ 
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // Haal eerst gezinsleden IDs op
    const { data: familyMembersForQuery } = await supabaseClient
      .from('family_members')
      .select('id')
      .eq('member_id', memberId)
      .eq('status', 'Actief');

    const familyMemberIds = (familyMembersForQuery || []).map(fm => fm.id);

    // Fetch lessons voor deze klant (zowel direct als via gezinsleden)
    let lessonParticipantsQuery = supabaseClient
      .from('lesson_participants')
      .select(`
        recurring_lesson_id,
        member_id,
        family_member_id,
        recurring_lessons:recurring_lesson_id (
          id,
          name,
          day_of_week,
          time,
          type,
          instructor,
          color,
          description,
          max_participants
        ),
        family_members:family_member_id (
          id,
          name
        )
      `)
      .eq('member_id', memberId);

    // Als er gezinsleden zijn, voeg die ook toe
    if (familyMemberIds.length > 0) {
      lessonParticipantsQuery = supabaseClient
        .from('lesson_participants')
        .select(`
          recurring_lesson_id,
          member_id,
          family_member_id,
          recurring_lessons:recurring_lesson_id (
            id,
            name,
            day_of_week,
            time,
            type,
            instructor,
            color,
            description,
            max_participants
          ),
          family_members:family_member_id (
            id,
            name
          )
        `)
        .or(`member_id.eq.${memberId},family_member_id.in.(${familyMemberIds.join(',')})`);
    }

    const { data: lessonParticipants, error: participantsError } = await lessonParticipantsQuery;

    if (participantsError) {
      console.error('Error fetching lessons:', participantsError);
    }

    // Fetch leskaarten
    const { data: leskaartenData, error: leskaartenError } = await supabaseClient
      .from('leskaarten')
      .select('id, totaal_lessen, gebruikte_lessen, resterende_lessen, start_datum, eind_datum, status, created_at, updated_at')
      .eq('klant_id', memberId)
      .order('created_at', { ascending: false });

    if (leskaartenError) {
      console.error('Error fetching leskaarten:', leskaartenError);
    }

    // Fetch gezinsleden
    const { data: familyMembersData, error: familyError } = await supabaseClient
      .from('family_members')
      .select('id, name, geboortedatum, email, telefoon, status')
      .eq('member_id', memberId)
      .eq('status', 'Actief');

    if (familyError) {
      console.error('Error fetching family members:', familyError);
    }

    // Fetch openstaande transacties
    const { data: transactionsData, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('id, date, description, amount, type, status')
      .eq('member_id', memberId)
      .eq('status', 'Open')
      .order('date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    // Format lessons response
    const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
    
    const lessons = (lessonParticipants || []).map((lp: any) => {
      const lesson = lp.recurring_lessons;
      if (!lesson) return null;
      
      return {
        id: lesson.id,
        name: lesson.name,
        day: days[lesson.day_of_week] || 'Onbekend',
        dayOfWeek: lesson.day_of_week,
        time: lesson.time ? lesson.time.substring(0, 5) : null,
        type: lesson.type,
        instructor: lesson.instructor,
        color: lesson.color,
        description: lesson.description,
        maxParticipants: lesson.max_participants,
        isFamilyMember: !!lp.family_member_id,
        familyMemberName: lp.family_members?.name || null
      };
    }).filter(Boolean);

    // Format leskaarten response
    const leskaarten = (leskaartenData || []).map((lk: any) => ({
      id: lk.id,
      totaalLessen: lk.totaal_lessen,
      gebruikteLessen: lk.gebruikte_lessen,
      resterendeLessen: lk.resterende_lessen,
      startDatum: lk.start_datum,
      eindDatum: lk.eind_datum,
      status: lk.status,
      created_at: lk.created_at,
      updated_at: lk.updated_at
    }));

    // Format gezinsleden response
    const familyMembers = (familyMembersData || []).map((fm: any) => ({
      id: fm.id,
      name: fm.name,
      geboortedatum: fm.geboortedatum,
      email: fm.email,
      telefoon: fm.telefoon,
      status: fm.status
    }));

    // Format transacties response
    const transactions = (transactionsData || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: parseFloat(t.amount) || 0,
      type: t.type,
      status: t.status
    }));

    // Calculate totaal resterende lessen over alle leskaarten
    const totaalResterendeLessen = leskaarten.reduce((sum: number, lk: any) => {
      return sum + (lk.resterendeLessen || 0);
    }, 0);

    return res.status(200).json({
      success: true,
      customer: {
        id: memberData.id,
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        status: memberData.status,
        balance: parseFloat(memberData.balance) || 0,
        klantType: memberData.klant_type,
        adres: memberData.adres,
        postcode: memberData.postcode,
        plaats: memberData.plaats,
        factuurAdres: memberData.factuur_adres,
        factuurPostcode: memberData.factuur_postcode,
        factuurPlaats: memberData.factuur_plaats,
        factuurEmail: memberData.factuur_email
      },
      lessons: lessons,
      leskaarten: leskaarten,
      totaalResterendeLessen: totaalResterendeLessen,
      familyMembers: familyMembers,
      openstaandeTransacties: transactions,
      saldo: parseFloat(memberData.balance) || 0
    });

  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
}

