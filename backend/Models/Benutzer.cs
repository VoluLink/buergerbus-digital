/// <summary>
/// Repräsentiert einen Benutzer des Systems.
/// Enthält Login-Daten, Profildaten, Rollen und optionale Fahrerinformationen.
/// </summary>
namespace BuergerbusAPI.Models
{
    public class Benutzer
    {
        public int Id { get; set; }
        public string Nutzername { get; set; }
        public string Email { get; set; }
        public string PasswortHash { get; set; }

        public string? Vorname { get; set; }
        public string? Nachname { get; set; }
        public string? Strasse { get; set; }
        public string? Postleitzahl { get; set; }
        public string? Ort { get; set; }
        public string? Telefonnummer { get; set; }
        public string? Fuehrerscheinklasse { get; set; }
        public DateTime? LetzteG25 { get; set; }
        public DateTime? NaechsteG25 { get; set; }
        public string? Bemerkung { get; set; }
        public DateTime AngelegtAm { get; set; }
        public DateTime? GeaendertAm { get; set; }
        public bool Aktiv { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        public Initiativen Initiative { get; set; }

        // Liste für Benachrichtigungen
        public List<Benachrichtigungen> Benachrichtigungen { get; set; } = new();

        //Liste für BenutzerRollen
        public List<BenutzerRolle> BenutzerRollen { get; set; } = new();

        // Aktuell ausgewählte Rolle des Benutzers
        public string? AktiveRolle { get; set; }

        // Benutzer kann ein Fahrer sein (1:1)
        public Fahrer? Fahrer { get; set; }

        public List<Fahrten> AngelegteFahrten { get; set; } = new();

        public List<PasswordResetToken> PasswordResetTokens { get; set; } = new();
    }
}
