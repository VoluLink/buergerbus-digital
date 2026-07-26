namespace BuergerbusAPI.Models
{
    public class FahrtTeilnehmer
    {
        public int Id { get; set; }

        public int FahrtId { get; set; }
        public Fahrten? Fahrt { get; set; }

        public int? FahrgastId { get; set; }
        public Fahrgast? Fahrgast { get; set; }

        public string Vorname { get; set; } = string.Empty;
        public string Nachname { get; set; } = string.Empty;
        public string? Adresse { get; set; }
        public string? Telefonnummer { get; set; }

        public bool IstAbgehakt { get; set; }
        public DateTime? AbgehaktAm { get; set; }

        public bool IstTemporaer { get; set; }
        public bool AlsStammgastGespeichert { get; set; }
        public DateTime? AnonymisiertAm { get; set; }

        public List<Teilstrecke> Teilstrecken { get; set; } = new();
    }
}
