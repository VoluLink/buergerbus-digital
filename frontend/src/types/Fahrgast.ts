export interface FahrgastBackendDto {
  id?: number
  Id?: number
  vorname?: string | null
  Vorname?: string | null
  nachname?: string | null
  Nachname?: string | null
  adresse?: string | null
  Adresse?: string | null
  email?: string | null
  Email?: string | null
  telefonnummer?: string | null
  Telefonnummer?: string | null
  bemerkung?: string | null
  Bemerkung?: string | null
  angelegtAm?: string
  AngelegtAm?: string
  geaendertAm?: string | null
  GeaendertAm?: string | null
  letzteNutzung?: string | null
  LetzteNutzung?: string | null
  aktiv?: boolean
  Aktiv?: boolean
  initiativeId?: number
  InitiativeId?: number
  initiativeName?: string | null
  InitiativeName?: string | null
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
  initiativeName?: string | null
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

export function normalizeFahrgastText(value: string | null | undefined): string {
  return value ?? ''
}

function readFahrgastDtoField<T>(
  dto: FahrgastBackendDto,
  lowerKey: keyof FahrgastBackendDto,
  upperKey: keyof FahrgastBackendDto,
): T | undefined {
  const lowerValue = dto[lowerKey]
  if (lowerValue !== undefined) {
    return lowerValue as T
  }

  const upperValue = dto[upperKey]
  if (upperValue !== undefined) {
    return upperValue as T
  }

  return undefined
}

export function normalizeFahrgastFormData(guest: {
  id: number
  vorname?: string | null
  nachname?: string | null
  adresse?: string | null
  email?: string | null
  telefonnummer?: string | null
  bemerkung?: string | null
  letzteNutzung?: string | null
  aktiv?: boolean | null
  initiativeId?: number | null
}): FahrgastFormData {
  return {
    vorname: normalizeFahrgastText(guest.vorname),
    nachname: normalizeFahrgastText(guest.nachname),
    adresse: normalizeFahrgastText(guest.adresse),
    email: normalizeFahrgastText(guest.email),
    telefonnummer: normalizeFahrgastText(guest.telefonnummer),
    bemerkung: normalizeFahrgastText(guest.bemerkung),
    letzteNutzung: normalizeFahrgastText(guest.letzteNutzung).slice(0, 10),
    aktiv: guest.aktiv === false ? 'false' : 'true',
    initiativeId: guest.initiativeId != null ? String(guest.initiativeId) : '',
  }
}

export function mapDtoToFahrgast(dto: FahrgastBackendDto): Fahrgast {
  const id = readFahrgastDtoField<number>(dto, 'id', 'Id') ?? 0
  const vorname = readFahrgastDtoField<string | null>(dto, 'vorname', 'Vorname')
  const nachname = readFahrgastDtoField<string | null>(dto, 'nachname', 'Nachname')
  const adresse = readFahrgastDtoField<string | null>(dto, 'adresse', 'Adresse')
  const email = readFahrgastDtoField<string | null>(dto, 'email', 'Email')
  const telefonnummer = readFahrgastDtoField<string | null>(dto, 'telefonnummer', 'Telefonnummer')
  const bemerkung = readFahrgastDtoField<string | null>(dto, 'bemerkung', 'Bemerkung')
  const angelegtAm = readFahrgastDtoField<string>(dto, 'angelegtAm', 'AngelegtAm') ?? ''
  const geaendertAm = readFahrgastDtoField<string | null>(dto, 'geaendertAm', 'GeaendertAm')
  const letzteNutzung = readFahrgastDtoField<string | null>(dto, 'letzteNutzung', 'LetzteNutzung')
  const aktiv = readFahrgastDtoField<boolean>(dto, 'aktiv', 'Aktiv') ?? true
  const initiativeId = readFahrgastDtoField<number>(dto, 'initiativeId', 'InitiativeId') ?? 0
  const initiativeName = readFahrgastDtoField<string | null>(dto, 'initiativeName', 'InitiativeName')

  return {
    id,
    vorname: normalizeFahrgastText(vorname),
    nachname: normalizeFahrgastText(nachname),
    adresse: normalizeFahrgastText(adresse),
    email: normalizeFahrgastText(email),
    telefonnummer: normalizeFahrgastText(telefonnummer),
    bemerkung: normalizeFahrgastText(bemerkung),
    angelegtAm,
    geaendertAm: normalizeFahrgastText(geaendertAm),
    letzteNutzung: normalizeFahrgastText(letzteNutzung),
    aktiv,
    initiativeId,
    initiativeName: initiativeName ?? null,
  }
}

export function mapFahrgastToDto(fahrgast: Fahrgast): FahrgastBackendDto {
  const vorname = normalizeFahrgastText(fahrgast.vorname).trim()
  const nachname = normalizeFahrgastText(fahrgast.nachname).trim()
  const adresse = normalizeFahrgastText(fahrgast.adresse).trim()
  const email = normalizeFahrgastText(fahrgast.email).trim()
  const telefonnummer = normalizeFahrgastText(fahrgast.telefonnummer).trim()
  const bemerkung = normalizeFahrgastText(fahrgast.bemerkung).trim()
  const geaendertAm = normalizeFahrgastText(fahrgast.geaendertAm).trim()

  return {
    Id: fahrgast.id,
    Vorname: vorname,
    Nachname: nachname,
    Adresse: adresse,
    Email: email ? email : null,
    Telefonnummer: telefonnummer ? telefonnummer : null,
    Bemerkung: bemerkung ? bemerkung : null,
    AngelegtAm: fahrgast.angelegtAm,
    GeaendertAm: geaendertAm ? geaendertAm : null,
    LetzteNutzung: normalizeFahrgastText(fahrgast.letzteNutzung) || null,
    Aktiv: fahrgast.aktiv,
    InitiativeId: fahrgast.initiativeId,
    InitiativeName: fahrgast.initiativeName ?? null,
  }
}
