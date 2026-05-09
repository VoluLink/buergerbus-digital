namespace BuergerbusAPI.Models
{
    public class Fahrten
    {
        public int Fahrten_Id { get; set; }
        public string Titel { get; set; }
        public DateTime Datum { get; set; }
        public string Zielort { get; set; }
        public string Fahrttyp { get; set; }
        public DateTime Startzeit { get; set; }
        public DateTime Endzeit { get; set; }
        public string Bemerkung { get; set; }
        public string Status { get; set; }
        public DateTime Angelegt_Am {  get; set; }
        public string Angelegt_Von { get; set; }

    }
}
