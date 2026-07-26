using BuergerbusAPI.DTOs;

namespace BuergerbusAPI.Services;

/// <summary>Central, server-side validation of ride and pickup time ranges.</summary>
public sealed class RideTimeValidationService
{
    public string? Validate(FahrtMetaDto ride, IEnumerable<CreateFahrtTeilnehmerDto> participants, bool isDraft, bool isRental)
    {
        if (ride.Datum == default)
            return "Fahrtdatum ist erforderlich.";

        if (ride.DatumBis.HasValue && ride.DatumBis.Value.Date < ride.Datum.Date)
            return "Das Enddatum darf nicht vor dem Fahrtdatum liegen.";

        // Drafts may be incomplete, but entered values must never contradict each other.
        if (ride.Startzeit == default)
            return isDraft ? null : "Startzeit ist erforderlich.";

        if (!isDraft && !ride.Endzeit.HasValue)
            return "Endzeit ist erforderlich.";

        if (ride.Endzeit.HasValue && ride.Endzeit.Value <= ride.Startzeit)
            return "Die Endzeit muss nach der Startzeit liegen.";

        if (!isRental && ride.Startzeit.Date != ride.Datum.Date)
            return "Die Startzeit muss am Fahrtdatum liegen.";

        if (ride.Endzeit.HasValue && !isRental && ride.Endzeit.Value.Date > ride.Datum.Date.AddDays(1))
            return "Die Endzeit liegt außerhalb des zulässigen Fahrtdatums.";

        foreach (var participant in participants)
        {
            if (participant.Startzeit.HasValue && participant.Startzeit.Value < ride.Startzeit)
                return $"Die Abholzeit von {DisplayName(participant)} darf nicht vor Beginn der Fahrt liegen.";

            if (ride.Endzeit.HasValue && participant.Startzeit.HasValue && participant.Startzeit.Value > ride.Endzeit.Value)
                return $"Die Abholzeit von {DisplayName(participant)} liegt nach dem Ende der Fahrt.";

            if (participant.Endzeit.HasValue && participant.Startzeit.HasValue && participant.Endzeit.Value < participant.Startzeit.Value)
                return $"Die Teilstrecken-Endzeit von {DisplayName(participant)} darf nicht vor der Abholzeit liegen.";

            if (participant.Endzeit.HasValue && participant.Endzeit.Value < ride.Startzeit)
                return $"Die Teilstreckenzeit von {DisplayName(participant)} liegt vor Beginn der Fahrt.";

            if (ride.Endzeit.HasValue && participant.Endzeit.HasValue && participant.Endzeit.Value > ride.Endzeit.Value)
                return $"Die Teilstrecken-Endzeit von {DisplayName(participant)} liegt nach dem Ende der Fahrt.";
        }

        return null;
    }

    private static string DisplayName(CreateFahrtTeilnehmerDto participant)
        => string.Join(' ', new[] { participant.Vorname, participant.Nachname }.Where(value => !string.IsNullOrWhiteSpace(value))).Trim() is { Length: > 0 } name
            ? name
            : "des Teilnehmers";
}
