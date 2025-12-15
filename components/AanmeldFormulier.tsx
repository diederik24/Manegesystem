import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const AanmeldFormulier: React.FC = () => {
  const [formData, setFormData] = useState({
    voorletters: '',
    voornaam: '',
    tussenvoegsel: '',
    achternaam: '',
    geboortedatum: '',
    adres: '',
    postcode: '',
    plaats: '',
    email: '',
    telefoon1: '',
    telefoon2: '',
    noodcontact_naam: '',
    noodcontact_telefoon: '',
    opmerking: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    // Validatie
    if (!formData.voornaam || !formData.achternaam || !formData.email) {
      setErrorMessage('Voornaam, achternaam en e-mail zijn verplicht.');
      setIsSubmitting(false);
      setSubmitStatus('error');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('nieuwe_aanmeldingen')
        .insert([
          {
            voorletters: formData.voorletters || null,
            voornaam: formData.voornaam,
            tussenvoegsel: formData.tussenvoegsel || null,
            achternaam: formData.achternaam,
            geboortedatum: formData.geboortedatum || null,
            adres: formData.adres || null,
            postcode: formData.postcode || null,
            plaats: formData.plaats || null,
            email: formData.email,
            telefoon1: formData.telefoon1 || null,
            telefoon2: formData.telefoon2 || null,
            noodcontact_naam: formData.noodcontact_naam || null,
            noodcontact_telefoon: formData.noodcontact_telefoon || null,
            opmerking: formData.opmerking || null,
            status: 'pending'
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      setSubmitStatus('success');
      // Reset formulier
      setFormData({
        voorletters: '',
        voornaam: '',
        tussenvoegsel: '',
        achternaam: '',
        geboortedatum: '',
        adres: '',
        postcode: '',
        plaats: '',
        email: '',
        telefoon1: '',
        telefoon2: '',
        noodcontact_naam: '',
        noodcontact_telefoon: '',
        opmerking: ''
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrorMessage(error.message || 'Er is een fout opgetreden bij het verzenden van het formulier.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header met gradient */}
        <div className="bg-gradient-to-r from-pink-500 via-red-500 to-pink-600 h-2 mb-8 rounded-t-lg"></div>
        
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Aanmelden voor Lessen</h1>
          <p className="text-slate-600 mb-8">Vul het onderstaande formulier in om je aan te melden voor lessen bij onze manege.</p>

          {/* Success/Error Messages */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Aanmelding verzonden!</p>
                <p className="text-green-700 text-sm mt-1">Je aanmelding is succesvol verzonden. We nemen zo spoedig mogelijk contact met je op.</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Fout bij verzenden</p>
                <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Naam velden */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="voorletters" className="block text-sm font-medium text-slate-700 mb-2">
                  Voorletters
                </label>
                <input
                  type="text"
                  id="voorletters"
                  name="voorletters"
                  value={formData.voorletters}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="voornaam" className="block text-sm font-medium text-slate-700 mb-2">
                  Voornaam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="voornaam"
                  name="voornaam"
                  value={formData.voornaam}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="tussenvoegsel" className="block text-sm font-medium text-slate-700 mb-2">
                  Tussenvoegsel
                </label>
                <input
                  type="text"
                  id="tussenvoegsel"
                  name="tussenvoegsel"
                  value={formData.tussenvoegsel}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="achternaam" className="block text-sm font-medium text-slate-700 mb-2">
                  Achternaam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="achternaam"
                  name="achternaam"
                  value={formData.achternaam}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            {/* Geboortedatum */}
            <div>
              <label htmlFor="geboortedatum" className="block text-sm font-medium text-slate-700 mb-2">
                Geboortedatum
              </label>
              <input
                type="date"
                id="geboortedatum"
                name="geboortedatum"
                value={formData.geboortedatum}
                onChange={handleChange}
                className="w-full md:w-1/2 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
              />
            </div>

            {/* Adres */}
            <div>
              <label htmlFor="adres" className="block text-sm font-medium text-slate-700 mb-2">
                Adres
              </label>
              <input
                type="text"
                id="adres"
                name="adres"
                value={formData.adres}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
              />
            </div>

            {/* Postcode en Plaats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-slate-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="plaats" className="block text-sm font-medium text-slate-700 mb-2">
                  Plaats
                </label>
                <input
                  type="text"
                  id="plaats"
                  name="plaats"
                  value={formData.plaats}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
              />
            </div>

            {/* Telefoon nummers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="telefoon1" className="block text-sm font-medium text-slate-700 mb-2">
                  Telefoon 1
                </label>
                <input
                  type="tel"
                  id="telefoon1"
                  name="telefoon1"
                  value={formData.telefoon1}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="telefoon2" className="block text-sm font-medium text-slate-700 mb-2">
                  Telefoon 2
                </label>
                <input
                  type="tel"
                  id="telefoon2"
                  name="telefoon2"
                  value={formData.telefoon2}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            {/* Noodcontact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="noodcontact_naam" className="block text-sm font-medium text-slate-700 mb-2">
                  Bij nood waarschuwen (naam)
                </label>
                <input
                  type="text"
                  id="noodcontact_naam"
                  name="noodcontact_naam"
                  value={formData.noodcontact_naam}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="noodcontact_telefoon" className="block text-sm font-medium text-slate-700 mb-2">
                  Bij nood waarschuwen (telefoon)
                </label>
                <input
                  type="tel"
                  id="noodcontact_telefoon"
                  name="noodcontact_telefoon"
                  value={formData.noodcontact_telefoon}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            {/* Opmerking */}
            <div>
              <label htmlFor="opmerking" className="block text-sm font-medium text-slate-700 mb-2">
                Opmerking
              </label>
              <textarea
                id="opmerking"
                name="opmerking"
                value={formData.opmerking}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-y"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Verzenden...</span>
                  </>
                ) : (
                  <span>Verzenden</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AanmeldFormulier;

