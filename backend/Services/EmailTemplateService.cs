using BuergerbusAPI.Data;
using BuergerbusAPI.DTOs;
using BuergerbusAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.RegularExpressions;

namespace BuergerbusAPI.Services;
public sealed record DriverAssignmentTemplateContext(string DriverName,string RideDate,string RideTime,string Destination,string InitiativeName);
public sealed record SelfRegistrationTemplateContext(string DriverName,string RideDate,string RideTime,string Destination,string InitiativeName);
public sealed record InvitationTemplateContext(string UserName,string ResetLink);
public sealed record RenderedEmail(string Subject,string Html,string PlainText);
public sealed class EmailTemplateService(AppDbContext db, ILogger<EmailTemplateService> logger)
{
    public static readonly string[] Types=["TripDriverAssigned","TripSelfRegistered","UserCreated"];
    public async Task<EmailTemplateDto> GetAsync(string type,CancellationToken ct=default){var saved=await db.EmailTemplates.AsNoTracking().SingleOrDefaultAsync(x=>x.TemplateType==type,ct);return saved is null?Default(type):Dto(saved);}
    public async Task<RenderedEmail> RenderAsync(string type, object context,CancellationToken ct=default){var template=await GetAsync(type,ct);var values=Values(context);try{return Render(template,values);}catch(Exception ex){logger.LogWarning(ex,"Template {Type} konnte nicht gerendert werden; Standard wird verwendet.",type);return Render(Default(type),values);}}
    public static EmailTemplateDto Default(string type)=>type switch {"TripDriverAssigned"=>new(0,type,"Neue Fahrt am {{RideDate}}","Neue Fahrt zugewiesen","Hallo {{DriverName}},","dir wurde eine neue Fahrt zugewiesen. Datum: {{RideDate}}\nUhrzeit: {{RideTime}}\nZiel: {{Destination}}","Details findest du nach dem Login.","Ihr Bürgerbus-Team","Diese Nachricht wurde automatisch erstellt.",DateTime.MinValue),"TripSelfRegistered"=>new(0,type,"Anmeldung zur Fahrt bestätigt","Anmeldung bestätigt","Hallo {{DriverName}},","du hast dich erfolgreich für die Fahrt am {{RideDate}} um {{RideTime}} angemeldet.","Details findest du nach dem Login.","Ihr Bürgerbus-Team","Diese Nachricht wurde automatisch erstellt.",DateTime.MinValue),"UserCreated"=>new(0,type,"Dein Bürgerbus-Account wurde erstellt","Willkommen","Hallo {{UserName}},","für dich wurde ein Benutzerkonto erstellt. Bitte setze dein Passwort über {{ResetLink}}.","","Ihr Bürgerbus-Team","Diese Nachricht wurde automatisch erstellt.",DateTime.MinValue),_=>throw new InvalidOperationException("Unbekannter Template-Typ.")};
    private static RenderedEmail Render(EmailTemplateDto t,Dictionary<string,string> v){string R(string s)=>Regex.Replace(s,@"\{\{\s*([^} ]+)\s*\}\}",m=>v.TryGetValue(m.Groups[1].Value,out var value)?value:m.Value);var subject=R(t.Subject);var text=string.Join("\n\n",new[]{R(t.Heading),R(t.Intro),R(t.Body),R(t.Closing),R(t.Signature),R(t.Footer)}.Where(x=>!string.IsNullOrWhiteSpace(x)));var html=$"<div style='font-family:Arial,sans-serif;line-height:1.6;color:#0f172a'><h2>{WebUtility.HtmlEncode(R(t.Heading))}</h2>{string.Join("",new[]{t.Intro,t.Body,t.Closing,t.Signature,t.Footer}.Where(x=>!string.IsNullOrWhiteSpace(x)).Select(x=>$"<p>{WebUtility.HtmlEncode(R(x)).Replace("\n","<br />")}</p>"))}</div>";return new(subject,html,text);}
    private static Dictionary<string,string> Values(object x)=>x switch {DriverAssignmentTemplateContext c=>new(){["DriverName"]=c.DriverName,["RideDate"]=c.RideDate,["RideTime"]=c.RideTime,["Destination"]=c.Destination,["InitiativeName"]=c.InitiativeName},SelfRegistrationTemplateContext c=>new(){["DriverName"]=c.DriverName,["RideDate"]=c.RideDate,["RideTime"]=c.RideTime,["Destination"]=c.Destination,["InitiativeName"]=c.InitiativeName},InvitationTemplateContext c=>new(){["UserName"]=c.UserName,["ResetLink"]=c.ResetLink},_=>throw new InvalidOperationException("Ungültiger Template-Kontext.")};
    private static EmailTemplateDto Dto(EmailTemplate x)=>new(x.Id,x.TemplateType,x.Subject,x.Heading,x.Intro,x.Body,x.Closing,x.Signature,x.Footer,x.UpdatedAtUtc);
}
