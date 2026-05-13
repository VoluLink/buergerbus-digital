using System.Linq;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BuergerbusAPI.Data;
using BuergerbusAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("Default"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("Default"))
    ));

builder.Services.AddScoped<IPasswordHasher<Benutzer>, PasswordHasher<Benutzer>>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");

app.UseAuthorization();

app.MapPost("/api/v1/auth/login", async (
    LoginRequest request,
    AppDbContext db,
    IPasswordHasher<Benutzer> passwordHasher
) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest("E-Mail und Passwort sind erforderlich.");
    }

    var user = await db.Benutzer.FirstOrDefaultAsync(u => u.Email == request.Email);

    if (user is null)
    {
        return Results.Text(
            "Ungültige Zugangsdaten.",
            statusCode: StatusCodes.Status401Unauthorized
        );
    }

    var passwordResult = passwordHasher.VerifyHashedPassword(user, user.PasswortHash, request.Password);

    if (passwordResult == PasswordVerificationResult.Failed)
    {
        return Results.Text(
            "Ungültige Zugangsdaten.",
            statusCode: StatusCodes.Status401Unauthorized
        );
    }

    if (passwordResult == PasswordVerificationResult.SuccessRehashNeeded)
    {
        user.PasswortHash = passwordHasher.HashPassword(user, request.Password);
        await db.SaveChangesAsync();
    }

    return Results.Ok(new
    {
        success = true,
        message = "Login erfolgreich.",
        email = request.Email,
    });
});

app.MapControllers();

try
{
    await SeedAdminUserAsync(app.Services);
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Fehler beim Seeding des initialen Admin-Benutzers.");
}

app.Run();

static async Task SeedAdminUserAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();

    var logger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("SeedAdminUser");

    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Benutzer>>();

    await db.Database.MigrateAsync();

    var email = Environment.GetEnvironmentVariable("SEED_ADMIN_EMAIL")
                ?? "admin@example.com";

    var password = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD")
                   ?? "Admin123!";

    var initiativeName = Environment.GetEnvironmentVariable("SEED_INITIATIVE_NAME")
                         ?? "Default";

    var existingUser = await db.Benutzer.FirstOrDefaultAsync(u => u.Email == email);
    if (existingUser is not null)
    {
        return;
    }

    var initiative = await db.Initiativen.FirstOrDefaultAsync();
    if (initiative is null)
    {
        initiative = new Initiativen
        {
            Name = initiativeName,
            AngelegtAm = DateTime.UtcNow,
        };

        db.Initiativen.Add(initiative);
        await db.SaveChangesAsync();
    }

    var user = new Benutzer
    {
        Nutzername = email,
        Email = email,
        InitiativeId = initiative.Id,
        PasswortHash = "",
    };

    user.PasswortHash = passwordHasher.HashPassword(user, password);

    db.Benutzer.Add(user);
    await db.SaveChangesAsync();

    logger.LogInformation("Seed-Admin-Benutzer {Email} wurde erstellt (InitiativeId={InitiativeId}).", email, user.InitiativeId);
}

record LoginRequest(string Email, string Password);
