namespace BuergerbusAPI.DTOs;
/// <summary>
/// Enthält DTOs für Initiativen und das Aktualisieren
/// der Initiative eines Benutzers.
/// </summary>
public record InitiativeDto(int Id, string Name);

public record InitiativeDetailsDto(
	int Id,
	string Name,
	string? Beschreibung,
	DateTime AngelegtAm,
	DateTime? GeaendertAm
);

public record CreateInitiativeRequest(string Name, string? Beschreibung);

public record UpdateInitiativeDetailsRequest(string Name, string? Beschreibung);

public record UpdateInitiativeRequest(int InitiativeId);

public record InitiativeDeletePreviewAffectedDto(
	int Users,
	int Vehicles,
	int MaintenanceRecords,
	int DamageReports,
	int Rides,
	int Passengers,
	int RideSegments
);

public record InitiativeDeletePreviewDto(
	int InitiativeId,
	string InitiativeName,
	bool CanDelete,
	bool IsDefault,
	string? Reason,
	InitiativeDeletePreviewAffectedDto Affected
);
