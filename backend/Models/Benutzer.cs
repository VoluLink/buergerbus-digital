namespace BuergerbusAPI.Models
{
    public class Benutzer
    {
        public int Id { get; set; }
        public string Nutzername { get; set; }
        public string Email { get; set; }
        public string Passwort_Hash { get; set; }


        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }
    }
}
