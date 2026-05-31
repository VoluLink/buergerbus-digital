namespace BuergerbusAPI.Models
{
    public class Initiativen
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Beschreibung { get; set; }
        public DateTime AngelegtAm { get; set; }
        public DateTime? GeaendertAm { get; set; }

        //Listen aller Hauptentitäten
        public List<Benutzer> Benutzer { get; set; } = new();
        public List<Fahrgast> Fahrgaeste { get; set; } = new();
        public List<Fahrzeug> Fahrzeuge { get; set; } = new();
        public List<Fahrten> Fahrten { get; set; } = new();
        public List<Benachrichtigungen> Benachrichtigungen { get; set; } = new();
        public List<Wartungen> Wartungen { get; set; } = new();
        public List<Schaden> Schaeden { get; set; } = new();
        public List<Loeschfristen> Loeschfristen { get; set; } = new();
       // public List<Teilstrecke> Teilstrecken { get; set; } = new();

    }
}
