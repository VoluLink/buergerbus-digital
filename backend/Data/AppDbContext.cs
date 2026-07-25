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
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<NotificationRecipient> NotificationRecipients { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        // Fahrten-System
        public DbSet<Fahrten> Fahrten { get; set; }
        public DbSet<FahrtTeilnehmer> FahrtTeilnehmer { get; set; }
        public DbSet<Teilstrecke> Teilstrecken { get; set; }

        // Fahrer
        public DbSet<Fahrer> Fahrer { get; set; }

        // Fahrzeuge
        public DbSet<Fahrzeug> Fahrzeuge { get; set; }
        public DbSet<Wartungen> Wartungen { get; set; }
        public DbSet<Schaden> Schaeden { get; set; }

        // Fahrgäste
        public DbSet<Fahrgast> Fahrgaeste { get; set; }

        // Initiative (Mandanten / Landkreise)
        public DbSet<Initiativen> Initiativen { get; set; }

        // Öffentliche Seiten und Footer
        public DbSet<SitePage> SitePages { get; set; }
        public DbSet<FooterLink> FooterLinks { get; set; }

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


            // Fahrt -> Benutzer (1:1)
            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.AngelegtVonUser)
                .WithMany(b => b.AngelegteFahrten)
                .HasForeignKey(f => f.AngelegtVonUserId);
                 

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

            // Fahrt -> FahrtTeilnehmer (1:n)

            modelBuilder.Entity<FahrtTeilnehmer>()
                .HasOne(tp => tp.Fahrt)
                .WithMany(f => f.Teilnehmer)
                .HasForeignKey(tp => tp.FahrtId)
                .OnDelete(DeleteBehavior.Cascade);

            // FahrtTeilnehmer -> Teilstrecke (1:n)

            modelBuilder.Entity<Teilstrecke>()
                .HasOne(t => t.FahrtTeilnehmer)
                .WithMany(tp => tp.Teilstrecken)
                .HasForeignKey(t => t.FahrtTeilnehmerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Fahrgast -> Teilstrecke (1:n)

            modelBuilder.Entity<Teilstrecke>()
                .HasOne(t => t.Fahrgast)
                .WithMany(f => f.Teilstrecken)
                .HasForeignKey(t => t.FahrgastId)
                .OnDelete(DeleteBehavior.SetNull);

            // Initiative -> Benutzer (1:n)

            modelBuilder.Entity<Benutzer>()
                .HasOne(b => b.Initiative)
                .WithMany(i => i.Benutzer)
                .HasForeignKey(b => b.InitiativeId);

            modelBuilder.Entity<PasswordResetToken>()
                .HasOne(t => t.Benutzer)
                .WithMany(b => b.PasswordResetTokens)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PasswordResetToken>()
                .HasIndex(t => t.TokenHash)
                .IsUnique();

            modelBuilder.Entity<Notification>()
                .HasMany(n => n.Recipients)
                .WithOne(r => r.Notification)
                .HasForeignKey(r => r.NotificationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.CreatedAt);

            modelBuilder.Entity<NotificationRecipient>()
                .HasIndex(r => new { r.NotificationId, r.UserId })
                .IsUnique();

            modelBuilder.Entity<NotificationRecipient>()
                .HasIndex(r => r.UserId);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(log => new { log.TimestampUtc, log.Action });

            modelBuilder.Entity<SitePage>()
                .HasIndex(page => page.Slug)
                .IsUnique();

            modelBuilder.Entity<FooterLink>()
                .HasOne(link => link.SitePage)
                .WithMany()
                .HasForeignKey(link => link.SitePageId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FooterLink>()
                .HasIndex(link => link.SitePageId);

            modelBuilder.Entity<FooterLink>()
                .HasIndex(link => new { link.IsActive, link.SortOrder });

            // Initiative -> Fahrten (1:n)

            modelBuilder.Entity<Fahrten>()
                .HasOne(f => f.Initiative)
                .WithMany(i => i.Fahrten)
                .HasForeignKey(f => f.InitiativeId);

            modelBuilder.Entity<Fahrten>()
                .HasIndex(f => new { f.InitiativeId, f.Datum });

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

            // Legacy: Fahrgast darf pro Fahrt nur einmal vorkommen.

            modelBuilder.Entity<Teilstrecke>()
                .HasIndex(t => new { t.FahrtId, t.FahrgastId })
                .IsUnique();

        }
    }
}
