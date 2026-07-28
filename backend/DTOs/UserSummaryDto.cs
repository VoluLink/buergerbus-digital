namespace BuergerbusAPI.DTOs; public record UserSummaryDto(int Id,string Username,string Email,InitiativeDto? Initiative,List<string> Roles,string? ActiveRole,int? FahrerId,bool IsActive);
