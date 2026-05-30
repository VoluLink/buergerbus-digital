namespace BuergerbusAPI.Models
{
    public class Fahrten
    {
        public int Id { get; set; }
        public string Titel { get; set; }
        public DateTime Datum { get; set; }
        public string Zielort { get; set; }
        public string Fahrttyp { get; set; }
        public DateTime Startzeit { get; set; }
        public DateTime? Endzeit { get; set; }
        public string? Bemerkung { get; set; }
        public string Status { get; set; }
        public DateTime AngelegtAm {  get; set; }
        public string AngelegtVon { get; set; }

       // 1..n - Fahrer..Fahrten
        public int? FahrerId { get; set; }
        public Fahrer? Fahrer { get; set; }

        // 1..n - Fahrzeug..Fahrten
        public int? FahrzeugId { get; set; }
        public Fahrzeug? Fahrzeug { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }

        //Liste für FahrtFahrgaste
        public List<Teilstrecke> Teilstrecken { get; set; } = new();
    }
}
