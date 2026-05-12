namespace BuergerbusAPI.Models
{
    public class Benachrichtigungen
    {
        public int Id { get; set; }
        public string Titel { get; set; }
        public string Nachricht { get; set; }
        public string Typ { get; set; }
        public int? ReferenzId { get; set; }
        public DateTime ErstelltAm { get; set; }
        public bool Gelesen { get; set; } = false;

        // 1..n - Benutzer .. Benachrichtigungen
        public int BenutzerId { get; set; }
        public Benutzer Benutzer { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }
    }
}
