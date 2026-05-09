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

        // Alle Beziehungen kommen in die Methode OnModelCreating()

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Benutzer ==> Rolle (n:m)
            modelBuilder.Entity<BenutzerRolle>()
                .HasKey(br => new { br.BenutzerId, br.RolleId });

            modelBuilder.Entity<BenutzerRolle>()
                .HasOne(br => br.Benutzer)
                .WithMany()
                .HasForeignKey(br => br.BenutzerId);

            modelBuilder.Entity<BenutzerRolle>()
                .HasOne(br => br.Rolle)
                .WithMany()
                .HasForeignKey(br => br.RolleId);

            // Benutzer ==> Benachrichtigungen (1:n)
            modelBuilder.Entity<Benachrichtigungen>()
                .HasOne(b => b.Benutzer)
                .WithMany()
                .HasForeignKey(b => b.BenutzerId);

            // Fahrer ==> Benutzer (1:1)
            modelBuilder.Entity<Fahrer>()
                .HasOne(f => f.Benutzer)
                .WithOne()
                .HasForeignKey<Fahrer>(f => f.BenutzerId);

            // Fahrer ==> Fahrten (1:n)
            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.Fahrer)
                .WithMany()
                .HasForeignKey(f => f.FahrerId);

            // Fahrzeug ==> Fahrten (1:n)
            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.Fahrzeug)
                .WithMany()
                .HasForeignKey(f => f.FahrzeugId);

            // Fahrer ==> Fahrzeug (n:m)
            modelBuilder.Entity<FahrerFahrzeug>()
                .HasKey(ff => new { ff.FahrerId, ff.FahrzeugId });

            modelBuilder.Entity<FahrerFahrzeug>()
                .HasOne(ff => ff.Fahrer)
                .WithMany()
                .HasForeignKey(ff => ff.FahrerId);

            modelBuilder.Entity<FahrerFahrzeug>()
                .HasOne(ff => ff.Fahrzeug)
                .WithMany()
                .HasForeignKey(ff => ff.FahrzeugId);

            // Fahrzeug ==> Wartungen (1:n)
            modelBuilder.Entity<Wartungen>()
                .HasOne(w => w.Fahrzeug)
                .WithMany()
                .HasForeignKey(w => w.FahrzeugId);

            // Fahrzeug ==> Schaden (1:n)
            modelBuilder.Entity<Schaden>()
                .HasOne(s => s.Fahrzeug)
                .WithMany()
                .HasForeignKey(s => s.FahrzeugId);

            // Fahrt ==> Fahrgast (n:m)
            modelBuilder.Entity<FahrtFahrgast>()
                .HasKey(ff => new { ff.FahrtId, ff.FahrgastId });

            modelBuilder.Entity<FahrtFahrgast>()
                .HasOne(ff => ff.Fahrt)
                .WithMany()
                .HasForeignKey(ff => ff.FahrtId);

            modelBuilder.Entity<FahrtFahrgast>()
                .HasOne(ff => ff.Fahrgast)
                .WithMany()
                .HasForeignKey(ff => ff.FahrgastId);

            // Fahrgast ==> Loeschfristen (1:1)
            modelBuilder.Entity<Loeschfristen>()
                .HasOne(l => l.Fahrgast)
                .WithOne()
                .HasForeignKey<Loeschfristen>(l => l.FahrgastId);

            // Initiative ==> alle (Mulit-Tenant-System) bei jeder (1:n)
            modelBuilder.Entity<Benutzer>()
                .HasOne(b => b.Initiative)
                .WithMany()
                .HasForeignKey(b => b.InitiativeId);

            modelBuilder.Entity<Fahrer>()
                .HasOne(f => f.Initiative)
                .WithMany()
                .HasForeignKey(f => f.InitiativeId);

            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.Initiative)
                .WithMany()
                .HasForeignKey(f => f.InitiativeId);

            modelBuilder.Entity<Fahrzeug>()
                .HasOne(f => f.Initiative)
                .WithMany()
                .HasForeignKey(f => f.InitiativeId);

            modelBuilder.Entity<Fahrgast>()
                .HasOne(f => f.Initiative)
                .WithMany()
                .HasForeignKey(f => f.InitiativeId);

            modelBuilder.Entity<Benachrichtigungen>()
                .HasOne(b => b.Initiative)
                .WithMany()
                .HasForeignKey(b => b.InitiativeId);

            modelBuilder.Entity<Schaden>()
                .HasOne(s => s.Initiative)
                .WithMany()
                .HasForeignKey(s => s.InitiativeId);

            modelBuilder.Entity<Wartungen>()
                .HasOne(w => w.Initiative)
                .WithMany()
                .HasForeignKey(w => w.InitiativeId);
        }
    }
}