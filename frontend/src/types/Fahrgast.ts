export interface FahrgastBackendDto {
  Id: number
  Vorname: string
  Nachname: string
  Adresse: string
  Email: string | null
  Telefonnummer: string | null
  Bemerkung: string | null
  AngelegtAm: string
  GeaendertAm: string | null
  LetzteNutzung: string
  Aktiv: boolean
  InitiativeId: number
}

export interface Fahrgast {
  id: number
  vorname: string
  nachname: string
  adresse: string
  email: string
  telefonnummer: string
  bemerkung: string
  angelegtAm: string
  geaendertAm: string
  letzteNutzung: string
  aktiv: boolean
  initiativeId: number
}

export interface FahrgastFormData {
  vorname: string
  nachname: string
  adresse: string
  email: string
  telefonnummer: string
  bemerkung: string
  letzteNutzung: string
  aktiv: 'true' | 'false'
  initiativeId: string
}

export function mapDtoToFahrgast(dto: FahrgastBackendDto): Fahrgast {
  return {
    id: dto.Id,
    vorname: dto.Vorname,
    nachname: dto.Nachname,
    adresse: dto.Adresse,
    email: dto.Email ?? '',
    telefonnummer: dto.Telefonnummer ?? '',
    bemerkung: dto.Bemerkung ?? '',
    angelegtAm: dto.AngelegtAm,
    geaendertAm: dto.GeaendertAm ?? '',
    letzteNutzung: dto.LetzteNutzung,
    aktiv: dto.Aktiv,
    initiativeId: dto.InitiativeId,
  }
}

export function mapFahrgastToDto(fahrgast: Fahrgast): FahrgastBackendDto {
  return {
    Id: fahrgast.id,
    Vorname: fahrgast.vorname,
    Nachname: fahrgast.nachname,
    Adresse: fahrgast.adresse,
    Email: fahrgast.email.trim() ? fahrgast.email : null,
    Telefonnummer: fahrgast.telefonnummer.trim() ? fahrgast.telefonnummer : null,
    Bemerkung: fahrgast.bemerkung.trim() ? fahrgast.bemerkung : null,
    AngelegtAm: fahrgast.angelegtAm,
    GeaendertAm: fahrgast.geaendertAm.trim() ? fahrgast.geaendertAm : null,
    LetzteNutzung: fahrgast.letzteNutzung,
    Aktiv: fahrgast.aktiv,
    InitiativeId: fahrgast.initiativeId,
  }
}
