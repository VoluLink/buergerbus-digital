using Microsoft.EntityFrameworkCore;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Fahrer> Fahrer { get; set; }

    }
}
