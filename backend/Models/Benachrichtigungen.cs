namespace BuergerbusAPI.Models
{
    public class Benachrichtigungen
    {
        public int Benachrichtigungen_Id { get; set; }
        public string Titel {  get; set; }
        public string Nachricht {  get; set; }
        public string Typ { get; set; }
        public int Referenz_Id { get; set; }
        public DateTime Erstellt_Am {  get; set; }
        public bool Gelesen {  get; set; }

    }
}
