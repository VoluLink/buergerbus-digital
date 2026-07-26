# Backend-Docker-Build-Netzwerk

Der Backend-Build nutzt `build.network: host`. Auf dem Zielhost kann der
isolierte BuildKit-Netzwerkraum `https://api.nuget.org/v3/index.json` nicht
erreichen; `dotnet restore` schlägt dort mit `NU1301` fehl. Das Host-Netzwerk
gilt nur für den Build-Schritt, nicht für den gestarteten Produktionscontainer.

Wenn DNS, Proxy und ausgehendes HTTPS im isolierten Build-Netzwerk später
verlässlich funktionieren, kann diese Einstellung erneut entfernt und mit
`docker compose --profile prod build backend-prod` geprüft werden.
