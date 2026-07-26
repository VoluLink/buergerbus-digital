using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace BuergerbusAPI.Data;

/// <summary>
/// Provides EF Core tooling with a context without requiring runtime-only secrets.
/// The fallback connection is never used for schema commands that do not access a database.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var configuredConnectionString = configuration.GetConnectionString("Default");
        var connectionString = string.IsNullOrWhiteSpace(configuredConnectionString)
            || configuredConnectionString.Contains("${", StringComparison.Ordinal)
            ? "server=localhost;port=3306;database=buergerbus;user=efcore;password=efcore;"
            : configuredConnectionString;

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseMySql(connectionString, ServerVersion.Parse("11.0.0-mariadb"));

        return new AppDbContext(optionsBuilder.Options);
    }
}
