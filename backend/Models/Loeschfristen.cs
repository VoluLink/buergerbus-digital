namespace BuergerbusAPI.Models
{
    public class Loeschfristen
    {
        public int Id { get; set; }
        public DateTime Loeschen_Am {  get; set; }
        public DateTime? Geloescht_Am { get; set; }
        public string? Grund {  get; set; }

        //1..1 - Fahrgast..Loeschfristen
        public int FahrgastId { get; set; }
        public Fahrgast Fahrgast { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }

    }
}
