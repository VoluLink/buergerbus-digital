namespace BuergerbusAPI.Models
{
    public class Loeschfristen
    {
        public int Loeschfristen_Id { get; set; }
        public DateTime Loeschen_Am {  get; set; }
        public DateTime Geloescht_Am { get; set; }
        public string Grund {  get; set; }

    }
}
