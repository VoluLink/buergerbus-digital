namespace BuergerbusAPI.Models
{
    public class Benutzer
    {
        public int Benutzer_Id { get; set; }
        public string Nutzername { get; set; }
        public string Email { get; set; }
        public string Passwort_Hash { get; set; }

    }
}
