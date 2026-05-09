using Microsoft.AspNetCore.Routing.Constraints;

namespace BuergerbusAPI.Models
{
    public class Fahrgast
    {
        public int Fahrgast_Id { get; set; }
        public string Vorname { get; set; }
        public string Nachname { get; set; }
        public string Adresse { get; set; }
        public string Email { get; set; }
        public string Telefonnummer { get; set; }
        public string Bemerkung { get; set; }
        public DateTime Angelegt_Am {  get; set; }
        public DateTime Geaendert_Am { get; set; }
        public DateTime Letzte_Nutzung { get; set; }
        public bool Aktiv {  get; set; }

    }
}
