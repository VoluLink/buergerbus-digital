namespace BuergerbusAPI.DTOs; public record UserRolesDto(int UserId,List<string> Roles,string? ActiveRole,string? NewToken=null);
