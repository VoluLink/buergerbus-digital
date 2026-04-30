namespace BuergerbusAPI.Models
{
    public class Fahrer
    {
        public int Id { get; set; }
        public string Vorname { get; set; }
        public string Nachname { get; set; }

        public string Telefonnummer { get; set; }

        public int InitiativeID { get; set; }
    }
}
