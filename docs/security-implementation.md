# Sicherheits- und Architekturentscheidungen

## Sitzung und Refresh

Die Anwendung verwendet kurzlebige signierte JWTs als Bearer-Token ausschließlich im
Arbeitsspeicher des Browsers. Der irreführende Refresh-Endpunkt wurde entfernt: nach Ablauf
oder nach einem Neuladen der Seite ist eine erneute Anmeldung erforderlich. Eine serverseitig
geprüfte `AuthVersion` macht bereits ausgegebene Tokens bei Passwortänderung oder
Kontodeaktivierung ungültig.

Login, Passwort-vergessen und Reset sind serverseitig rate-limitiert.
Der Rate-Limiter verwendet bewusst die Remote-IP-Adresse, die ASP.NET erhält. Da die
Forwarded-Headers-Konfiguration ausdrücklich nicht geändert werden darf, ist hinter einem
Proxy keine Aussage über die tatsächliche Client-IP möglich.

## Bewusst unverändert

* Passwort-Mindestlänge und Passwortvalidierung wurden nicht geändert.
* Security Headers wurden nicht ergänzt oder geändert.
* `UseForwardedHeaders` und `ForwardedHeadersOptions` wurden nicht ergänzt oder geändert.

## Noch erforderliche Ausbaustufen

MFA, rotierende Refresh-Sessions, Datenschutz-Aufbewahrung, Concurrency-Tokens
und ein externer Address-Provider benötigen migrations- und betriebsspezifische Entscheidungen
(z. B. Schlüsselverwaltung, Provider-Vertrag und Datenaufbewahrungsfristen). Sie sind nicht
ohne diese produktionsrelevanten Festlegungen sicher aktivierbar.
