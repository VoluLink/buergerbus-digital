using Microsoft.AspNetCore.Routing.Constraints;

namespace BuergerbusAPI.Models
{
    public class Wartungen
    {
        public int Wartung_Id { get; set; }
        public DateTime Letzter_Termin {  get; set; }
        public DateTime Naechster_Termin { get; set; }
        public string Grund { get; set; }
        public string Ort {  get; set; }
        public decimal Kosten {  get; set; }


    }
}
