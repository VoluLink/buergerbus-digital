namespace BuergerbusAPI.Models
{
    public class Initiativen
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Beschreibung { get; set; }
        public DateTime Angelegt_Am { get; set; }
        public DateTime? Geaendert_Am { get; set; }

        //Listen aller Hauptentitäten
        public List<Benutzer> Benutzer { get; set; }
        public List<Fahrer> Fahrer { get; set; }
        public List<Fahrgast> Fahrgaeste { get; set; }
        public List<Fahrzeug> Fahrzeuge { get; set; }
        public List<Fahrten> Fahrten { get; set; }
        public List<Benachrichtigungen> Benachrichtigungen { get; set; }
        public List<Wartungen> Wartungen { get; set; }
        public List<Schaden> Schaeden { get; set; }
        public List<Loeschfristen> Loeschfristen { get; set; }

    }
}
