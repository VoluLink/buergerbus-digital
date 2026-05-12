namespace BuergerbusAPI.Models
{
    public class Benutzer
    {
        public int Id { get; set; }
        public string Nutzername { get; set; }
        public string Email { get; set; }
        public string PasswortHash { get; set; }


        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }

        // Liste für Benachrichtigungen
        public List<Benachrichtigungen> Benachrichtigungen { get; set; } = new();

        //Liste für BenutzerRollen
        public List<BenutzerRolle> BenutzerRollen { get; set; } = new();

        // Benutzer kann ein Fahrer sein (1:1)
        public Fahrer Fahrer { get; set; }
    }
}
