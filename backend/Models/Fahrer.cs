/// <summary>
/// Enthält zusätzliche fahrerspezifische Daten eines Benutzers,
/// z. B. Führerscheinklasse und G25-Untersuchungen.
/// </summary>
namespace BuergerbusAPI.Models
{
    public class Fahrer
    {
        public int Id { get; set; }
        public string? Fuehrerscheinklasse { get; set; }
        public DateTime? LetzteG25 { get; set; }
        public DateTime? NaechsteG25 { get; set; }
        public string? Bemerkung {  get; set; }
        public DateTime AngelegtAm {  get; set; }
        public DateTime? GeaendertAm { get; set; }
        public bool Aktiv {  get; set; }

        // 1..n - Benutzer..Fahrer
        public int BenutzerId { get; set; }
        public Benutzer Benutzer { get; set; }

        //Liste für Fahrten
        public List<Fahrten> Fahrten { get; set; } = new();

        // Liste für FahrerFahrzeug
        public List<FahrerFahrzeug> FahrerFahrzeuge { get; set; } = new();

    }
}
