namespace BuergerbusAPI.Models
{
    public class Rollen
    {
        public int Id { get; set; }
        public required string Rollenname { get; set; }

        //Liste der BenutzerRollen
        public List<BenutzerRolle> BenutzerRollen { get; set; } = new();
    }
}
