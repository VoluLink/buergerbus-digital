namespace BuergerbusAPI.Models
{
    public class BenutzerRolle
    {
        public int BenutzerId { get; set; }
        public Benutzer Benutzer { get; set; }


        public int RolleId { get; set; }
        public Rollen Rolle { get; set; }

    }
}
