using Microsoft.AspNetCore.Routing.Constraints;

namespace BuergerbusAPI.Models
{
    public class Wartungen
    {
        public int Id { get; set; }
        public DateTime Letzter_Termin {  get; set; }
        public DateTime Naechster_Termin { get; set; }
        public string Grund { get; set; }
        public string Ort {  get; set; }
        public decimal Kosten {  get; set; }

        //1..n - Fahrzeug..Wartungen
        public int FahrzeugId { get; set; }
        public Fahrzeug Fahrzeug { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }
    }
}
