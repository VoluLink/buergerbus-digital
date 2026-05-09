namespace BuergerbusAPI.Models
{
    public class Schaden
    {
        public int Schaden_Id { get; set; }
        public string Beschreibung { get; set; }
        public DateTime Enstanden_Am { get; set; }
        public DateTime Behoben_Am { get; set; }
        public string Status { get; set; }

    }
}
