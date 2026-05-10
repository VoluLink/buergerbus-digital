namespace BuergerbusAPI.Models
{
    public class Fahrer
    {
        public int Id { get; set; }
        public string Vorname { get; set; }
        public string Nachname { get; set; }
        public string  Adresse { get; set; }
        public string Telefonnummer { get; set; }
        public string Fuehrerscheinklasse { get; set; }
        public DateTime LetzteG25 { get; set; }
        public DateTime NaechsteG25 { get; set; }
        public string Bemerkung {  get; set; }
        public DateTime Angelegt_Am {  get; set; }
        public DateTime Geaendert_Am { get; set; }
        public bool Aktiv {  get; set; }

        // 1..n - Benutzer..Fahrer
        public int BenutzerId { get; set; }
        public Benutzer Benutzer { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }

        public List<Fahrten> Fahrten { get; set; }
    }
}
