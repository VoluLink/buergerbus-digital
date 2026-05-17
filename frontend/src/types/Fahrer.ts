// Backend DTO – spiegelt das C# Fahrer-Modell wider
export interface FahrerBackendDto {
  id: number
  vorname: string
  nachname: string
  adresse: string
  telefonnummer: string | null
  fuehrerscheinklasse: string
  letzteG25: string        // ISO-Datumsstring
  naechsteG25: string | null
  bemerkung: string | null
  angelegtAm: string
  geaendertAm: string | null
  aktiv: boolean
  benutzerId: number
  initiativeId: number
}

// Frontend-Modell: DTO + rein frontend-seitige Felder
export interface Fahrer extends FahrerBackendDto {
  emailadresse: string    // frontend-only, nicht im Backend
}

// Formulardaten für Anlegen / Bearbeiten
export interface FahrerFormData {
  vorname: string
  nachname: string
  adresse: string
  telefonnummer: string
  fuehrerscheinklasse: string
  letzteG25: string
  naechsteG25: string
  bemerkung: string
  aktiv: boolean
  emailadresse: string    // frontend-only
}

export function mapDtoToFahrer(dto: FahrerBackendDto): Fahrer {
  return { ...dto, emailadresse: '' }
}

export function mapFahrerToDto(
  formData: FahrerFormData,
  benutzerId: number,
  initiativeId: number,
): Omit<FahrerBackendDto, 'id' | 'angelegtAm' | 'geaendertAm'> {
  return {
    vorname: formData.vorname,
    nachname: formData.nachname,
    adresse: formData.adresse,
    telefonnummer: formData.telefonnummer || null,
    fuehrerscheinklasse: formData.fuehrerscheinklasse,
    letzteG25: formData.letzteG25,
    naechsteG25: formData.naechsteG25 || null,
    bemerkung: formData.bemerkung || null,
    aktiv: formData.aktiv,
    benutzerId,
    initiativeId,
  }
}
