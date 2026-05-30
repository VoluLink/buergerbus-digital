using Microsoft.EntityFrameworkCore;
using BuergerbusAPI.Models;
/// <summary>
/// Zentraler Entity Framework Core Datenbankkontext.
/// Enthält alle DbSet-Definitionen und konfiguriert Beziehungen,
/// Schlüssel und Einschränkungen zwischen den Datenbanktabellen.
/// </summary>
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
        public DbSet<Teilstrecke> Teilstrecken { get; set; }

        // Fahrer
        public DbSet<Fahrer> Fahrer { get; set; }
        public DbSet<FahrerFahrzeug> FahrerFahrzeuge { get; set; }

        // Fahrzeuge
        public DbSet<Fahrzeug> Fahrzeuge { get; set; }
        public DbSet<Wartungen> Wartungen { get; set; }
        public DbSet<Schaden> Schaeden { get; set; }

        // Fahrgäste
        public DbSet<Fahrgast> Fahrgaeste { get; set; }
        public DbSet<Loeschfristen> Loeschfristen { get; set; }

        // Initiative (Mandanten / Landkreise)
        public DbSet<Initiativen> Initiativen { get; set; }

        // Kommunikation
        public DbSet<Benachrichtigungen> Benachrichtigungen { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Benutzer <-> Rollen (n:m)

            modelBuilder.Entity<BenutzerRolle>()
                .HasKey(br => new { br.BenutzerId, br.RolleId });

            modelBuilder.Entity<BenutzerRolle>()
                .HasOne(br => br.Benutzer)
                .WithMany(b => b.BenutzerRollen)
                .HasForeignKey(br => br.BenutzerId);

            modelBuilder.Entity<BenutzerRolle>()
                .HasOne(br => br.Rolle)
                .WithMany(r => r.BenutzerRollen)
                .HasForeignKey(br => br.RolleId);

            // Benutzer -> Benachrichtigungen (1:n)

            modelBuilder.Entity<Benachrichtigungen>()
                .HasOne(b => b.Benutzer)
                .WithMany(b => b.Benachrichtigungen)
                .HasForeignKey(b => b.BenutzerId);

            // Benutzer <-> Fahrer (1:1)

            modelBuilder.Entity<Fahrer>()
                .HasOne(f => f.Benutzer)
                .WithOne(b => b.Fahrer)
                .HasForeignKey<Fahrer>(f => f.BenutzerId);

            // Fahrer -> Fahrten (1:n)

            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.Fahrer)
                .WithMany(f => f.Fahrten)
                .HasForeignKey(f => f.FahrerId)
                .OnDelete(DeleteBehavior.SetNull);

            // Fahrzeug -> Fahrten (1:n)

            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.Fahrzeug)
                .WithMany(fz => fz.Fahrten)
                .HasForeignKey(f => f.FahrzeugId)
                .OnDelete(DeleteBehavior.SetNull);

            // Fahrer <-> Fahrzeug (n:m)

            modelBuilder.Entity<FahrerFahrzeug>()
                .HasKey(ff => new { ff.FahrerId, ff.FahrzeugId });

            modelBuilder.Entity<FahrerFahrzeug>()
                .HasOne(ff => ff.Fahrer)
                .WithMany(f => f.FahrerFahrzeuge)
                .HasForeignKey(ff => ff.FahrerId);

            modelBuilder.Entity<FahrerFahrzeug>()
                .HasOne(ff => ff.Fahrzeug)
                .WithMany(f => f.FahrerFahrzeuge)
                .HasForeignKey(ff => ff.FahrzeugId);

            // Fahrzeug -> Wartungen (1:n)

            modelBuilder.Entity<Wartungen>()
                .HasOne(w => w.Fahrzeug)
                .WithMany(f => f.Wartungen)
                .HasForeignKey(w => w.FahrzeugId);

            // Fahrzeug -> Schäden (1:n)

            modelBuilder.Entity<Schaden>()
                .HasOne(s => s.Fahrzeug)
                .WithMany(f => f.Schaeden)
                .HasForeignKey(s => s.FahrzeugId);

            // Fahrt -> Teilstrecke (1:n)

            modelBuilder.Entity<Teilstrecke>()
                .HasOne(t => t.Fahrt)
                .WithMany(f => f.Teilstrecken)
                .HasForeignKey(t => t.FahrtId);

            // Fahrgast -> Teilstrecke (1:n)

            modelBuilder.Entity<Teilstrecke>()
                .HasOne(t => t.Fahrgast)
                .WithMany(f => f.Teilstrecken)
                .HasForeignKey(t => t.FahrgastId)
                .OnDelete(DeleteBehavior.Cascade);

            // Initiative -> Teilstrecke (1:n)

            //modelBuilder.Entity<Teilstrecke>()
            //    .HasOne(t => t.Initiative)
            //    .WithMany(i => i.Teilstrecken)
            //    .HasForeignKey(t => t.InitiativeId);

            // Fahrgast <-> Löschfristen (1:1)

            modelBuilder.Entity<Loeschfristen>()
                .HasOne(l => l.Fahrgast)
                .WithOne(f => f.Loeschfrist)
                .HasForeignKey<Loeschfristen>(l => l.FahrgastId);

            // Initiative -> Benutzer (1:n)

            modelBuilder.Entity<Benutzer>()
                .HasOne(b => b.Initiative)
                .WithMany(i => i.Benutzer)
                .HasForeignKey(b => b.InitiativeId);

            // Initiative -> Fahrten (1:n)

            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.Initiative)
                .WithMany(i => i.Fahrten)
                .HasForeignKey(f => f.InitiativeId);

            // Initiative -> Fahrzeuge (1:n)

            modelBuilder.Entity<Fahrzeug>()
                .HasOne(f => f.Initiative)
                .WithMany(i => i.Fahrzeuge)
                .HasForeignKey(f => f.InitiativeId);

            // Initiative -> Fahrgäste (1:n)

            modelBuilder.Entity<Fahrgast>()
                .HasOne(f => f.Initiative)
                .WithMany(i => i.Fahrgaeste)
                .HasForeignKey(f => f.InitiativeId);

            // Initiative -> Benachrichtigungen (1:n)

            modelBuilder.Entity<Benachrichtigungen>()
                .HasOne(b => b.Initiative)
                .WithMany(i => i.Benachrichtigungen)
                .HasForeignKey(b => b.InitiativeId);

            // Initiative -> Wartungen (1:n)

            modelBuilder.Entity<Wartungen>()
                .HasOne(w => w.Initiative)
                .WithMany(i => i.Wartungen)
                .HasForeignKey(w => w.InitiativeId);

            // Initiative -> Schäden (1:n)

            modelBuilder.Entity<Schaden>()
                .HasOne(s => s.Initiative)
                .WithMany(i => i.Schaeden)
                .HasForeignKey(s => s.InitiativeId);

            // Initiative -> Löschfristen (1:n)

            modelBuilder.Entity<Loeschfristen>()
                .HasOne(l => l.Initiative)
                .WithMany(i => i.Loeschfristen)
                .HasForeignKey(l => l.InitiativeId);

            // Fahrgast darf pro Fahrt nur einmal vorkommen

            modelBuilder.Entity<Teilstrecke>()
                .HasIndex(t => new { t.FahrtId, t.FahrgastId })
                .IsUnique();
        }
    }
}