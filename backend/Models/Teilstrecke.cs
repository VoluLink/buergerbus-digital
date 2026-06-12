namespace BuergerbusAPI.Models
{
    public class Teilstrecke
    {
        public int Id { get; set; }

        public string Abholadresse { get; set; }
        public string Zieladresse { get; set; }

        // Optional für Planung
        public DateTime? Startzeit { get; set; }
        public DateTime? Endzeit { get; set; }

        // Optional Fahrer entscheidet selbst
        public int? Reihenfolge { get; set; }
        public string? Status { get; set; }

        public int? FahrtTeilnehmerId { get; set; }
        public FahrtTeilnehmer? FahrtTeilnehmer { get; set; }

        // Teilstrecke .. Fahrt - n .. 1
        public int FahrtId { get; set; }
        public Fahrten Fahrt { get; set; }

        // Legacy-Feld bleibt für die Übergangsphase erhalten.
        public int? FahrgastId { get; set; }
        public Fahrgast? Fahrgast { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
       // public int InitiativeId { get; set; }
       // public Initiativen Initiative { get; set; }
    }
}
