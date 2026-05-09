namespace BuergerbusAPI.Models
{
    public class Fahrzeug
    {
        public int Fahrzeug_Id { get; set; }
        public string Kennzeichen { get; set; }
        public string Bezeichnung { get; set; }
        public byte Kapazitaet {  get; set; }
        public int Kilometerstand { get; set; }
        public DateTime Betriebsaufnahme {  get; set; }
        public string Bemerkung { get; set; }
        public string Status { get; set; }
        public bool Aktiv {  get; set; }

    }
}
