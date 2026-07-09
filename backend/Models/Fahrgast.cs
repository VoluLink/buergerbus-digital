using Microsoft.AspNetCore.Routing.Constraints;

namespace BuergerbusAPI.Models
{
    public class Fahrgast
    {
        public int Id { get; set; }
        public string Vorname { get; set; }
        public string Nachname { get; set; }
        public string Adresse { get; set; }
        public string? Email { get; set; }
        public string? Telefonnummer { get; set; }
        public string? Bemerkung { get; set; }
        public DateTime AngelegtAm {  get; set; }
        public DateTime? GeaendertAm { get; set; }
        public DateTime? LetzteNutzung { get; set; }
        public bool Aktiv {  get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }

        // Übergangsnavigation für bestehende Teilstrecken.
        public List<Teilstrecke> Teilstrecken { get; set; } = new();


    }
}
