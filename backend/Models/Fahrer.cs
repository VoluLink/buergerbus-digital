namespace BuergerbusAPI.Models
{
    public class Fahrer
    {
        public int Fahrer_Id { get; set; }
        public string Vorname { get; set; }
        public string Nachname { get; set; }
        public string  Adresse { get; set; }
        public string Telefonnummer { get; set; }
        public string Fuehrerscheinklasse { get; set; }
        public DateTime LetzteG25 { get; set; }
        public DateTime NaechsteG25 { get; set; }
        public string Bemerkung {  get; set; }
        public DateTime Angelegt_Am {  get; set; }
        public DateTime Geaendert_Am { get; set; }
        public bool Aktiv {  get; set; }
        public int InitiativeID { get; set; }
    }
}
