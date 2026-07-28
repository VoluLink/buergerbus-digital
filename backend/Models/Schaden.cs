namespace BuergerbusAPI.Models
{
    public class Schaden
    {
        public int Id { get; set; }
        public required string Beschreibung { get; set; }
        public DateTime Enstanden_Am { get; set; }
        public DateTime? Behoben_Am { get; set; }
        public required string Status { get; set; }

        // 1..n - Fahrzeug..Schaden
        public int FahrzeugId { get; set; }
        public Fahrzeug? Fahrzeug { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen? Initiative { get; set; }
    }
}
