namespace BuergerbusAPI.Models
{
    public class FahrerFahrzeug
    {
        public int FahrerId { get; set; }
        public Fahrer Fahrer { get; set; }



        public int FahrzeugId { get; set; }
        public Fahrzeug Fahrzeug { get; set; }

    }
}
