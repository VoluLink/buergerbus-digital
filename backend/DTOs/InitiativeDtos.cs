namespace BuergerbusAPI.DTOs;
/// <summary>
/// Enthält DTOs für Initiativen und das Aktualisieren
/// der Initiative eines Benutzers.
/// </summary>
public record InitiativeDto(int Id, string Name);

public record UpdateInitiativeRequest(int InitiativeId);
