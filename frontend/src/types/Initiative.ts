export type Initiative = {
  id: number
  name: string
  beschreibung: string | null
  angelegtAm: string
  geaendertAm: string | null
}

export type CreateInitiativeRequest = {
  name: string
  beschreibung: string
}
