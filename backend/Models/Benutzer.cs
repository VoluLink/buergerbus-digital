/// <summary>
/// Repräsentiert einen Benutzer des Systems.
/// Enthält Login-Daten, Profildaten, Rollen und optionale Fahrerinformationen.
/// </summary>
namespace BuergerbusAPI.Models
{
    public class Benutzer
    {
        public int Id { get; set; }
        public required string Nutzername { get; set; }
        public required string Email { get; set; }
        public required string PasswortHash { get; set; }

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
        // Incremented whenever all previously issued access tokens must become invalid.
        public int AuthVersion { get; set; }

        // Initiative muss in jeder Tabelle sein (Multi-Tenant System) => Landkreis als Datengrenze
        public int InitiativeId { get; set; }
        // Navigation may be absent when EF materializes without Include; the FK remains required.
        public Initiativen? Initiative { get; set; }

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
