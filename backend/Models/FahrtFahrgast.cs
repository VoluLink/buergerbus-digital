namespace BuergerbusAPI.Models
{
    public class FahrtFahrgast
    {
        public int FahrtId { get; set; }
        public Fahrten Fahrt { get; set; }


        public int FahrgastId { get; set; }
        public Fahrgast Fahrgast { get; set; }
    }
}
