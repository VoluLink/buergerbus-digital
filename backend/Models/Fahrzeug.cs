namespace BuergerbusAPI.Models
{
    public class Fahrzeug
    {
        public int Id { get; set; }
        public string Kennzeichen { get; set; }
        public string Bezeichnung { get; set; }
        public byte Kapazitaet {  get; set; }
        public int Kilometerstand { get; set; }
        public DateTime Betriebsaufnahme {  get; set; }
        public string? Bemerkung { get; set; }
        public string Status { get; set; }
        public bool Aktiv {  get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }

        //Liste für FahrerFahrzeug
        public List<FahrerFahrzeug> FahrerFahrzeuge { get; set; }

        //Liste für Wartungen
        public List<Wartungen> Wartungen { get; set; }

        //Liste für Schaden
        public List<Schaden> Schaeden { get; set; }

        //Liste für Fahrten
        public List<Fahrten> Fahrten { get; set; }
    }
}
