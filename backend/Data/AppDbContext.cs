using Microsoft.EntityFrameworkCore;
using BuergerbusAPI.Models;

namespace BuergerbusAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Benutzer & Rechte
        public DbSet<Benutzer> Benutzer { get; set; }
        public DbSet<Rollen> Rollen { get; set; }
        public DbSet<BenutzerRolle> BenutzerRollen { get; set; }

        // Fahrten-System
        public DbSet<Fahrten> Fahrten { get; set; }
        public DbSet<FahrtFahrgast> FahrtFahrgaeste { get; set; }

        // Fahrer
        public DbSet<Fahrer> Fahrer { get; set; }
        public DbSet<FahrerFahrzeug> FahrerFahrzeuge { get; set; }

        // Fahrzeuge
        public DbSet<Fahrzeug> Fahrzeug { get; set; }
        public DbSet<Wartungen> Wartungen { get; set; }
        public DbSet<Schaden> Schaden { get; set; }

        // Fahrgäste
        public DbSet<Fahrgast> Fahrgast { get; set; }
        public DbSet<Loeschfristen> Loeschfristen { get; set; }

        // Initiative (Landkreis / Mandant)
        public DbSet<Initiativen> Initiativen { get; set; }

        // Kommunikation
        public DbSet<Benachrichtigungen> Benachrichtigungen { get; set; }
    }
}