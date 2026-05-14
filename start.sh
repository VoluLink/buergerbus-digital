#!/usr/bin/env bash

set -Eeuo pipefail
IFS=$'\n\t'

# ==========================================================
# Projekt Setup Script (Bürgerbus Digital)
# - erstellt/aktualisiert eine .env Datei (Docker Compose)
# - startet optional die Container
# ==========================================================

ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"
ENV_FOUND="false"
DB_RESET_STATUS="beibehalten"

# Farben (fallback-safe)
if command -v tput >/dev/null 2>&1 && [[ -t 1 ]]; then
  RED="$(tput setaf 1)"
  GREEN="$(tput setaf 2)"
  YELLOW="$(tput setaf 3)"
  BLUE="$(tput setaf 4)"
  CYAN="$(tput setaf 6)"
  BOLD="$(tput bold)"
  RESET="$(tput sgr0)"
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; BOLD=""; RESET=""
fi

print_header() {
  if command -v clear >/dev/null 2>&1 && [[ -t 1 ]]; then
    clear
  fi

  echo -e "${CYAN}╔══════════════════════════════════════════════╗${RESET}"
  echo -e "${CYAN}║${RESET} ${BOLD}Bürgerbus Digital — Setup Assistent${RESET}          ${CYAN}║${RESET}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${RESET}"
  echo
}

ask_database_reset_if_env_exists() {
  [[ "$ENV_FOUND" == "true" ]] || return 0

  echo
  echo -e "${CYAN}──────────────────────────${RESET}"
  echo -e "${CYAN} Datenbank zurücksetzen${RESET}"
  echo -e "${CYAN}──────────────────────────${RESET}"
  echo "Es wurde bereits eine .env Datei gefunden."
  echo "Möchtest du die bestehende Datenbank vollständig neu erstellen?"
  echo
  echo -e "${YELLOW}Achtung:${RESET}"
  echo "- Alle vorhandenen Daten gehen dabei verloren."
  echo "- Docker Volumes werden gelöscht."
  echo "- Die Datenbank wird beim nächsten Start automatisch neu erstellt."
  echo "- Migrationen und Seed-Daten werden erneut ausgeführt."
  echo
  echo "Optionen:"
  echo "  1) Bestehende Datenbank beibehalten"
  echo "  2) Datenbank vollständig zurücksetzen (docker compose down -v)"
  echo

  local choice=""
  while true; do
    read -r -p "$(echo -e "${BOLD}Bitte wählen${RESET} [1]: ")" choice
    if [[ -z "$choice" ]]; then
      choice="1"
    fi

    case "$choice" in
      1)
        DB_RESET_STATUS="beibehalten"
        print_info "Datenbank wird beibehalten."
        return 0
        ;;
      2)
        if ! command -v docker >/dev/null 2>&1; then
          print_error "Docker wurde nicht gefunden. Datenbank-Reset wird übersprungen."
          DB_RESET_STATUS="beibehalten"
          return 0
        fi
        if ! detect_compose_cmd; then
          print_error "Docker Compose wurde nicht gefunden. Datenbank-Reset wird übersprungen."
          DB_RESET_STATUS="beibehalten"
          return 0
        fi

        echo
        if ! ask_yes_no "Bist du sicher? Alle Daten gehen unwiderruflich verloren." "N"; then
          print_info "Reset abgebrochen. Datenbank wird beibehalten."
          DB_RESET_STATUS="beibehalten"
          return 0
        fi

        print_warning "Führe aus: ${COMPOSE_CMD[*]} down -v"
        "${COMPOSE_CMD[@]}" down -v
        DB_RESET_STATUS="zurückgesetzt"
        print_success "Datenbank-Volumes wurden entfernt."

        if ask_yes_no "Optional: ungenutzte Docker Volumes bereinigen (docker volume prune)?" "n"; then
          docker volume prune -f || true
          print_success "Ungenutzte Volumes bereinigt."
        fi

        print_info "Hinweis: Beim nächsten Start legt das Backend die DB an, führt Migrationen aus und seedet Initialdaten."
        return 0
        ;;
      *)
        print_warning "Ungültige Auswahl. Bitte 1 oder 2 eingeben."
        ;;
    esac
  done
}
print_success() { echo -e "${GREEN}✔${RESET} $1"; }
print_warning() { echo -e "${YELLOW}⚠${RESET} $1"; }
print_error() { echo -e "${RED}✖${RESET} $1"; }
print_info() { echo -e "${BLUE}ℹ${RESET} $1"; }

on_error() {
  local exit_code=$?
  print_error "Abbruch (Exit-Code: ${exit_code})."
  print_info "Fehler bei Zeile ${BASH_LINENO[0]}: ${BASH_COMMAND}"
  exit "$exit_code"
}
trap on_error ERR

repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd
}

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    print_error "Datei nicht gefunden: $file"
    exit 1
  fi
}

COMPOSE_CMD=()

detect_compose_cmd() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
    return 0
  fi
  COMPOSE_CMD=()
  return 1
}

generate_password() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 24 | tr -d '\n'
  else
    date +%s | sha256sum | base64 | head -c 32
  fi
}

read_env_value() {
  local file="$1"
  local key="$2"
  [[ -f "$file" ]] || return 1

  # KEY=VALUE (ohne export). Wir nehmen bewusst nur die erste passende Zeile.
  local line
  line="$(grep -m1 -E "^${key}=" "$file" 2>/dev/null || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  echo "${line#*=}"
}

default_for() {
  local key="$1"
  local value=""

  value="$(read_env_value "$ENV_FILE" "$key" || true)"
  if [[ -n "$value" ]]; then
    echo "$value"
    return 0
  fi

  value="$(read_env_value "$ENV_EXAMPLE_FILE" "$key" || true)"
  if [[ -n "$value" ]]; then
    echo "$value"
    return 0
  fi

  return 1
}

ask_value() {
  local key="$1"
  local label="$2"
  local default_value="$3"
  local value=""

  read -r -p "$(echo -e "${BOLD}${label}${RESET} [${default_value}]: ")" value
  if [[ -z "$value" ]]; then
    echo "$default_value"
  else
    echo "$value"
  fi
}

ask_int() {
  local key="$1"
  local label="$2"
  local default_value="$3"
  local value=""

  while true; do
    read -r -p "$(echo -e "${BOLD}${label}${RESET} [${default_value}]: ")" value
    if [[ -z "$value" ]]; then
      value="$default_value"
    fi
    if [[ "$value" =~ ^[0-9]+$ ]] && (( value > 0 )); then
      echo "$value"
      return 0
    fi
    print_warning "Bitte eine positive Zahl eingeben." >&2
  done
}

ask_secret() {
  local key="$1"
  local label="$2"
  local existing_present="$3" # true/false
  local generated_password
  local value=""

  generated_password="$(generate_password)"

  if [[ "$existing_present" == "true" ]]; then
    echo -e "${BLUE}ℹ${RESET} ${label}: Enter = beibehalten | 'r' = neu generieren | sonst = manuell setzen" >&2
    read -r -s -p "$(echo -e "${BOLD}${label}${RESET}: ")" value
    echo >&2
    if [[ -z "$value" ]]; then
      # Marker für "keep"
      echo "__KEEP__"
      return 0
    fi
    if [[ "$value" == "r" || "$value" == "R" ]]; then
      print_success "${label} wurde neu generiert." >&2
      echo "$generated_password"
      return 0
    fi
    echo "$value"
    return 0
  fi

  read -r -s -p "$(echo -e "${BOLD}${label}${RESET} [Enter = automatisch generieren]: ")" value
  echo >&2
  if [[ -z "$value" ]]; then
    print_success "${label} wurde automatisch generiert." >&2
    echo "$generated_password"
  else
    echo "$value"
  fi
}

ask_yes_no() {
  local label="$1"
  local default_value="$2" # Y/n
  local value=""

  read -r -p "$(echo -e "${BOLD}${label}${RESET} [${default_value}]: ")" value
  if [[ -z "$value" ]]; then
    value="$default_value"
  fi
  case "$value" in
    y|Y|yes|YES|j|J|ja|JA) return 0 ;;
    n|N|no|NO|nein|NEIN) return 1 ;;
    *)
      # Default interpretieren
      if [[ "$default_value" == "Y" || "$default_value" == "y" ]]; then
        return 0
      fi
      return 1
      ;;
  esac
}

backup_env_file() {
  local ts
  ts="$(date +%Y%m%d_%H%M%S)"
  cp "$ENV_FILE" ".env.backup.${ts}"
  print_success "Backup erstellt: .env.backup.${ts}"
}

validate_vite_api_url() {
  local url="$1"
  if [[ -z "$url" ]]; then
    print_error "VITE_API_BASE_URL ist leer. Das Frontend würde mit Fehler abbrechen."
    return 1
  fi
  if [[ "$url" =~ ^http://backend(:[0-9]+)?(/.*)?$ || "$url" =~ ^http://backend$ ]]; then
    print_warning "VITE_API_BASE_URL zeigt auf 'backend'. Das ist aus dem Browser i.d.R. nicht erreichbar."
    print_info "Empfehlung für lokale Nutzung: http://localhost:5000"
  fi
  return 0
}

is_localhost_url() {
  local url="$1"
  [[ "$url" =~ ^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])([:/]|$) ]]
}

normalize_origin() {
  local input="$1"
  # akzeptiert origin oder URL mit Pfad und schneidet auf scheme://host(:port)
  if [[ "$input" =~ ^(https?://[^/]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

detect_primary_ipv4() {
  # Liefert die primäre IPv4 dieser Maschine (typisch: Server-IP im LAN), oder leer.
  local ip_addr=""

  if command -v ip >/dev/null 2>&1; then
    ip_addr="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}' || true)"
    if [[ -n "$ip_addr" && "$ip_addr" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ && ! "$ip_addr" =~ ^127\. ]]; then
      echo "$ip_addr"
      return 0
    fi
  fi

  if command -v hostname >/dev/null 2>&1; then
    # hostname -I gibt ggf. mehrere IPs; wir nehmen die erste
    ip_addr="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
    if [[ -n "$ip_addr" && "$ip_addr" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ && ! "$ip_addr" =~ ^127\. ]]; then
      echo "$ip_addr"
      return 0
    fi
  fi

  return 1
}

default_cors_origins_development() {
  if [[ -n "${SERVER_IPV4:-}" ]]; then
    echo "http://localhost:5173,http://${SERVER_IPV4}:5173"
  else
    echo "http://localhost:5173"
  fi
}

merge_cors_defaults_development() {
  # Merged existierende Origins mit dem Dev-Default (localhost + ggf. Server-IP)
  # und gibt eine kommagetrennte Liste ohne Duplikate zurück.
  local existing_csv="$1"
  local wanted_csv="$2"

  local combined=""
  if [[ -n "${existing_csv// }" ]]; then
    combined="${existing_csv},${wanted_csv}"
  else
    combined="$wanted_csv"
  fi

  local out=""
  local part trimmed
  IFS=',' read -r -a parts <<<"$combined"
  for part in "${parts[@]}"; do
    trimmed="${part//[$'\t\r\n']/}"
    trimmed="${trimmed## }"
    trimmed="${trimmed%% }"
    [[ -z "$trimmed" ]] && continue
    if [[ ",$out," != *",$trimmed,"* ]]; then
      if [[ -z "$out" ]]; then
        out="$trimmed"
      else
        out="$out,$trimmed"
      fi
    fi
  done

  echo "$out"
}

default_backend_url_remote() {
  # 1) Wenn in vorhandener .env schon gesetzt und nicht localhost: das wiederverwenden
  # 2) Sonst aus primärer Server-IP ableiten
  # 3) Fallback (wenn keine IP erkannt): localhost
  local existing_vite=""
  existing_vite="$(read_env_value "$ENV_FILE" VITE_API_BASE_URL || true)"
  if [[ -n "$existing_vite" ]] && ! is_localhost_url "$existing_vite"; then
    echo "$existing_vite"
    return 0
  fi

  if [[ -n "${SERVER_IPV4:-}" ]]; then
    echo "http://${SERVER_IPV4}:5000"
    return 0
  fi

  echo "http://localhost:5000"
}

ask_environment() {
  local choice=""
  echo -e "${CYAN}──────────────────────────${RESET}" >&2
  echo -e "${CYAN} Environment Auswahl${RESET}" >&2
  echo -e "${CYAN}──────────────────────────${RESET}" >&2
  echo "  1) Development" >&2
  echo "     Programmieren und Debuggen" >&2
  echo >&2
  echo "  2) Staging" >&2
  echo "     Produktivnah testen" >&2
  echo >&2
  echo "  3) Production" >&2
  echo "     Echter Livebetrieb" >&2
  echo >&2

  while true; do
    read -r -p "$(echo -e "${BOLD}Bitte wählen${RESET} [1]: ")" choice
    if [[ -z "$choice" ]]; then
      choice="1"
    fi
    case "$choice" in
      1) echo "Development"; return 0 ;;
      2) echo "Staging"; return 0 ;;
      3) echo "Production"; return 0 ;;
      *) print_warning "Ungültige Auswahl. Bitte 1, 2 oder 3 eingeben." >&2 ;;
    esac
  done
}

ask_url() {
  local label="$1"
  local default_value="$2"
  local allow_localhost="$3" # true/false
  local url=""

  while true; do
    url="$(ask_value "" "$label" "$default_value")"
    url="${url//[$'\t\r\n']/}"

    if [[ -z "$url" ]]; then
      print_warning "Bitte eine URL eingeben (http:// oder https://)." >&2
      continue
    fi
    if [[ ! "$url" =~ ^https?:// ]]; then
      print_warning "Ungültige URL. Muss mit http:// oder https:// beginnen." >&2
      continue
    fi
    if [[ "$allow_localhost" != "true" ]] && is_localhost_url "$url"; then
      print_error "localhost/127.0.0.1 ist hier nicht erlaubt (Browser-Sicht!)." >&2
      continue
    fi
    if [[ "$url" =~ [[:space:]] ]]; then
      print_warning "URL enthält Whitespace. Bitte korrigieren." >&2
      continue
    fi
    echo "$url"
    return 0
  done
}

ask_frontend_origin() {
  local default_origin="$1"
  local input=""
  local origin=""

  while true; do
    input="$(ask_value "" "Frontend-Adresse im Browser (Origin)" "$default_origin")"
    origin="$(normalize_origin "$input" || true)"
    if [[ -n "$origin" ]]; then
      echo "$origin"
      return 0
    fi
    print_warning "Bitte eine gültige URL/Origin angeben, z.B. http://localhost:5173 oder https://example.com" >&2
  done
}

warn_if_placeholder() {
  local key="$1"
  local value="$2"
  if [[ "$value" =~ ^HIER ]]; then
    print_warning "${key} sieht nach Platzhalter aus (beginnt mit 'HIER…')."
  fi
}

warn_if_whitespace() {
  local key="$1"
  local value="$2"
  if [[ "$value" =~ [[:space:]] ]]; then
    print_warning "${key} enthält Whitespace. In .env/Compose kann das problematisch sein (ggf. ohne Quotes)."
  fi
}

check_required_env_keys() {
  local missing=()
  local key value

  for key in \
    VITE_API_BASE_URL \
    ASPNETCORE_ENVIRONMENT \
    DB_NAME DB_USER DB_PASSWORD DB_ROOT_PASSWORD \
    CORS_ALLOWED_ORIGINS \
    SEED_ADMIN_EMAIL SEED_ADMIN_PASSWORD SEED_INITIATIVE_NAME \
    DB_SEED_MAX_ATTEMPTS
  do
    value="$(read_env_value "$ENV_FILE" "$key" || true)"
    if [[ -z "$value" ]]; then
      missing+=("$key")
      continue
    fi
    warn_if_placeholder "$key" "$value"
  done

  for key in DB_NAME DB_USER DB_PASSWORD DB_ROOT_PASSWORD SEED_ADMIN_PASSWORD; do
    value="$(read_env_value "$ENV_FILE" "$key" || true)"
    [[ -n "$value" ]] && warn_if_whitespace "$key" "$value"
  done

  if (( ${#missing[@]} > 0 )); then
    print_warning ".env scheint unvollständig zu sein (leere/missing Keys): ${missing[*]}"
    print_info "Tipp: Script erneut ausführen und 'aktualisieren' wählen."
  fi
}

assert_env_sane() {
  local env_name vite cors
  env_name="$(read_env_value "$ENV_FILE" ASPNETCORE_ENVIRONMENT || true)"
  vite="$(read_env_value "$ENV_FILE" VITE_API_BASE_URL || true)"
  cors="$(read_env_value "$ENV_FILE" CORS_ALLOWED_ORIGINS || true)"

  local required=(
    DB_NAME DB_USER DB_PASSWORD DB_ROOT_PASSWORD
    ASPNETCORE_ENVIRONMENT
    VITE_API_BASE_URL
    SEED_ADMIN_EMAIL SEED_ADMIN_PASSWORD SEED_INITIATIVE_NAME
    DB_SEED_MAX_ATTEMPTS
  )

  local missing=()
  local key value
  for key in "${required[@]}"; do
    value="$(read_env_value "$ENV_FILE" "$key" || true)"
    if [[ -z "${value// }" ]]; then
      missing+=("$key")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    print_error "Die erzeugte .env hat leere Pflichtwerte: ${missing[*]}"
    exit 1
  fi

  # Environment-spezifische Regeln
  if [[ "$env_name" == "Production" || "$env_name" == "Staging" ]]; then
    if [[ -z "${cors// }" ]]; then
      print_error "In ${env_name} darf CORS_ALLOWED_ORIGINS nicht leer sein."
      exit 1
    fi
    if is_localhost_url "$vite"; then
      print_error "In ${env_name} darf VITE_API_BASE_URL nicht auf localhost zeigen."
      exit 1
    fi
  fi

  print_success ".env geprüft: keine leeren Pflichtwerte."
}

print_header

ROOT="$(repo_root)"
cd "$ROOT"

SERVER_IPV4="$(detect_primary_ipv4 || true)"

require_file "docker-compose.yml"

print_info "Arbeitsverzeichnis: $ROOT"
echo

# .env Handling
should_write_env="false"
if [[ -f "$ENV_FILE" ]]; then
  ENV_FOUND="true"
  print_success ".env gefunden."
  if ask_yes_no "Soll die .env aktualisiert werden (Werte abfragen)?" "n"; then
    should_write_env="true"
    backup_env_file
  else
    print_info "Nutze bestehende .env unverändert."
  fi
else
  print_warning ".env fehlt und wird erstellt."
  should_write_env="true"
fi

ask_database_reset_if_env_exists

if [[ ! -f "$ENV_EXAMPLE_FILE" ]]; then
  print_warning ".env.example wurde nicht gefunden (Defaults werden minimal gesetzt)."
fi

if [[ "$should_write_env" == "true" ]]; then
  ASPNETCORE_ENVIRONMENT="$(ask_environment)"
  IS_DEVELOPMENT="false"
  if [[ "$ASPNETCORE_ENVIRONMENT" == "Development" ]]; then
    IS_DEVELOPMENT="true"
  fi

  echo -e "${CYAN}──────────────────────────${RESET}"
  echo -e "${CYAN} Datenbank (MariaDB)${RESET}"
  echo -e "${CYAN}──────────────────────────${RESET}"

  print_info "Standard (Docker Compose): DB_HOST=db und DB_PORT=3306 beibehalten."
  print_info "Nur ändern, wenn du bewusst eine externe DB (außerhalb von Compose) nutzt."

  DB_HOST_DEFAULT="$(default_for DB_HOST || echo "db")"
  DB_PORT_DEFAULT="$(default_for DB_PORT || echo "3306")"
  DB_NAME_DEFAULT="$(default_for DB_NAME || echo "fahrdienst")"
  DB_USER_DEFAULT="$(default_for DB_USER || echo "fahrdienst_user")"

  DB_HOST="$(ask_value DB_HOST "DB_HOST" "$DB_HOST_DEFAULT")"
  DB_PORT="$(ask_value DB_PORT "DB_PORT" "$DB_PORT_DEFAULT")"
  DB_NAME="$(ask_value DB_NAME "DB_NAME" "$DB_NAME_DEFAULT")"
  DB_USER="$(ask_value DB_USER "DB_USER" "$DB_USER_DEFAULT")"

  if [[ "$DB_HOST" != "db" ]]; then
    print_warning "DB_HOST ist '${DB_HOST}'. In Compose ist normalerweise 'db' korrekt (sonst findet der Backend-Container die DB evtl. nicht)."
  fi
  if [[ "$DB_PORT" != "3306" ]]; then
    print_warning "DB_PORT ist '${DB_PORT}'. In Compose ist normalerweise '3306' korrekt (interner DB-Port)."
  fi

  existing_db_password="$(read_env_value "$ENV_FILE" DB_PASSWORD || true)"
  if [[ -n "$existing_db_password" ]]; then
    DB_PASSWORD="$(ask_secret DB_PASSWORD "DB_PASSWORD" "true")"
    if [[ "$DB_PASSWORD" == "__KEEP__" ]]; then
      DB_PASSWORD="$existing_db_password"
    fi
  else
    DB_PASSWORD="$(ask_secret DB_PASSWORD "DB_PASSWORD" "false")"
  fi

  existing_db_root_password="$(read_env_value "$ENV_FILE" DB_ROOT_PASSWORD || true)"
  if [[ -n "$existing_db_root_password" ]]; then
    DB_ROOT_PASSWORD="$(ask_secret DB_ROOT_PASSWORD "DB_ROOT_PASSWORD" "true")"
    if [[ "$DB_ROOT_PASSWORD" == "__KEEP__" ]]; then
      DB_ROOT_PASSWORD="$existing_db_root_password"
    fi
  else
    DB_ROOT_PASSWORD="$(ask_secret DB_ROOT_PASSWORD "DB_ROOT_PASSWORD" "false")"
  fi

  echo
  echo -e "${CYAN}──────────────────────────${RESET}"
  echo -e "${CYAN} Backend/Frontend (CORS + API URL)${RESET}"
  echo -e "${CYAN}──────────────────────────${RESET}"

  echo "Environment: ${ASPNETCORE_ENVIRONMENT}"
  if [[ -n "${SERVER_IPV4:-}" ]]; then
    echo "Server-IP erkannt:      ${SERVER_IPV4}"
  else
    echo "Server-IP erkannt:      -"
  fi
  echo

  print_info "VITE_API_BASE_URL ist die URL, unter der der Browser das Backend erreicht."
  print_info "'localhost' funktioniert nur, wenn Browser und Backend auf demselben Rechner laufen."
  print_info "Wenn Benutzer von anderen PCs/Smartphones zugreifen, nutze Server-IP oder Domain."
  echo
  echo "Beispiele:"
  echo "  http://localhost:5000"
  echo "  http://192.168.178.115:5000"
  echo "  https://api.example.com"
  echo

  # Frontend-Adresse (für sinnvollen CORS Default)
  existing_frontend_origin_guess="$(read_env_value "$ENV_FILE" CORS_ALLOWED_ORIGINS || true)"
  frontend_origin_default=""

  if [[ "$IS_DEVELOPMENT" == "true" ]]; then
    if ask_yes_no "Wird das Frontend ausschließlich auf demselben Rechner genutzt wie das Backend?" "N"; then
      # Browser läuft auf derselben Maschine wie das Backend
      VITE_API_BASE_URL="http://localhost:5000"
      frontend_origin_default="http://localhost:5173"
    else
      # Browser erreicht Backend über IP/Domain
      remote_default="$(default_backend_url_remote)"
      VITE_API_BASE_URL="$(ask_url "VITE_API_BASE_URL (Backend URL)" "$remote_default" "true")"
      if [[ -n "${SERVER_IPV4:-}" ]]; then
        frontend_origin_default="http://${SERVER_IPV4}:5173"
      else
        frontend_origin_default="http://localhost:5173"
      fi
      print_info "Tipp: Wenn du das Frontend über IP/Domain aufrufst, muss CORS_ALLOWED_ORIGINS diese Origin enthalten."
    fi
  else
    # Staging/Production: niemals automatisch localhost
    VITE_API_BASE_URL="$(ask_url "VITE_API_BASE_URL (Backend URL)" "" "false")"
    if [[ -n "${SERVER_IPV4:-}" ]]; then
      frontend_origin_default="http://${SERVER_IPV4}:5173"
    else
      frontend_origin_default="https://example.com"
    fi
  fi

  # Frontend Origin abfragen (für CORS Default)
  FRONTEND_ORIGIN="$(ask_frontend_origin "$frontend_origin_default")"

  echo
  echo -e "${CYAN}──────────────────────────${RESET}"
  echo -e "${CYAN} CORS (Backend)${RESET}"
  echo -e "${CYAN}──────────────────────────${RESET}"

  print_info "CORS_ALLOWED_ORIGINS: kommagetrennte Origins, die Browser-Requests ans Backend erlauben."
  print_info "Typisch ist die Frontend-Origin, z.B. ${FRONTEND_ORIGIN}"
  if [[ "$IS_DEVELOPMENT" == "true" ]]; then
    print_info "Development: leer = alle Origins erlauben (Program.cs unterstützt das)."
  else
    print_info "Staging/Production: darf NICHT leer sein (mindestens eine Origin)."
  fi

  derived_cors_default="$FRONTEND_ORIGIN"
  if [[ "$IS_DEVELOPMENT" == "true" ]]; then
    derived_cors_default="$(default_cors_origins_development)"
  fi
  existing_cors_value="$(read_env_value "$ENV_FILE" CORS_ALLOWED_ORIGINS || true)"
  example_cors_value="$(read_env_value "$ENV_EXAMPLE_FILE" CORS_ALLOWED_ORIGINS || true)"

  if [[ "$IS_DEVELOPMENT" == "true" ]]; then
    # Dev: Default soll localhost + Server-IP enthalten (und vorhandene Origins nicht verlieren)
    CORS_DEFAULT="$(merge_cors_defaults_development "$existing_cors_value" "$derived_cors_default")"
  elif [[ -n "$existing_cors_value" ]]; then
    CORS_DEFAULT="$existing_cors_value"
  elif [[ -n "$example_cors_value" ]]; then
    # wenn example mehrere origins enthält, aber wir einen klaren default wollen,
    # nehmen wir trotzdem derived_cors_default als default (nutzer kann überschreiben)
    CORS_DEFAULT="$derived_cors_default"
  else
    CORS_DEFAULT="$derived_cors_default"
  fi

  while true; do
    CORS_ALLOWED_ORIGINS="$(ask_value CORS_ALLOWED_ORIGINS "CORS_ALLOWED_ORIGINS" "$CORS_DEFAULT")"
    # Trim check
    if [[ -z "${CORS_ALLOWED_ORIGINS// }" ]]; then
      if [[ "$IS_DEVELOPMENT" == "true" ]]; then
        break
      fi
      print_error "CORS_ALLOWED_ORIGINS darf in ${ASPNETCORE_ENVIRONMENT} nicht leer sein."
      continue
    fi
    break
  done

  if [[ "$IS_DEVELOPMENT" != "true" ]]; then
    if is_localhost_url "$VITE_API_BASE_URL"; then
      print_error "In ${ASPNETCORE_ENVIRONMENT} ist VITE_API_BASE_URL=localhost nicht erlaubt."
      exit 1
    fi
  fi

  echo
  echo -e "${CYAN}──────────────────────────${RESET}"
  echo -e "${CYAN} Initialer Admin-Seed (optional)${RESET}"
  echo -e "${CYAN}──────────────────────────${RESET}"

  SEED_ADMIN_EMAIL_DEFAULT="$(default_for SEED_ADMIN_EMAIL || echo "admin@example.com")"
  SEED_INITIATIVE_NAME_DEFAULT="$(default_for SEED_INITIATIVE_NAME || echo "Default")"

  SEED_ADMIN_EMAIL="$(ask_value SEED_ADMIN_EMAIL "SEED_ADMIN_EMAIL" "$SEED_ADMIN_EMAIL_DEFAULT")"

  existing_seed_password="$(read_env_value "$ENV_FILE" SEED_ADMIN_PASSWORD || true)"
  if [[ -n "$existing_seed_password" ]]; then
    SEED_ADMIN_PASSWORD="$(ask_secret SEED_ADMIN_PASSWORD "SEED_ADMIN_PASSWORD" "true")"
    if [[ "$SEED_ADMIN_PASSWORD" == "__KEEP__" ]]; then
      SEED_ADMIN_PASSWORD="$existing_seed_password"
    fi
  else
    SEED_ADMIN_PASSWORD="$(ask_secret SEED_ADMIN_PASSWORD "SEED_ADMIN_PASSWORD" "false")"
  fi

  SEED_INITIATIVE_NAME="$(ask_value SEED_INITIATIVE_NAME "SEED_INITIATIVE_NAME" "$SEED_INITIATIVE_NAME_DEFAULT")"

  echo
  echo -e "${CYAN}──────────────────────────${RESET}"
  echo -e "${CYAN} Seed/Migration Retry${RESET}"
  echo -e "${CYAN}──────────────────────────${RESET}"

  DB_SEED_MAX_ATTEMPTS_DEFAULT="$(default_for DB_SEED_MAX_ATTEMPTS || echo "10")"
  DB_SEED_MAX_ATTEMPTS="$(ask_int DB_SEED_MAX_ATTEMPTS "DB_SEED_MAX_ATTEMPTS" "$DB_SEED_MAX_ATTEMPTS_DEFAULT")"

  # Harte Pflichtfeld-Checks (nach Input, vor Schreiben)
  if [[ -z "${DB_NAME// }" || -z "${DB_USER// }" ]]; then
    print_error "DB_NAME und DB_USER dürfen nicht leer sein."
    exit 1
  fi
  if [[ -z "${DB_PASSWORD// }" || -z "${DB_ROOT_PASSWORD// }" ]]; then
    print_error "DB_PASSWORD und DB_ROOT_PASSWORD dürfen nicht leer sein."
    exit 1
  fi
  if [[ -z "${SEED_ADMIN_PASSWORD// }" ]]; then
    print_error "SEED_ADMIN_PASSWORD darf nicht leer sein."
    exit 1
  fi

  cat > "$ENV_FILE" <<EOF
# ==========================================================
# Automatisch generierte .env Datei (Docker Compose)
# Erstellt am: $(date)
# ==========================================================

# =========================
# Datenbank (MariaDB)
# =========================
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}

# =========================
# Backend (ASP.NET Core)
# =========================
ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT}

# =========================
# CORS (Backend)
# - "*" erlaubt alle Origins
# - In Development: leer = alle Origins (Program.cs)
# =========================
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}

# =========================
# Frontend (Vite)
# Hinweis: Muss aus dem Browser erreichbar sein.
# =========================
VITE_API_BASE_URL=${VITE_API_BASE_URL}

# =========================
# Initialer Admin-Seed (Backend)
# =========================
SEED_ADMIN_EMAIL=${SEED_ADMIN_EMAIL}
SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD}
SEED_INITIATIVE_NAME=${SEED_INITIATIVE_NAME}

# =========================
# Seed/Migration Retry
# =========================
DB_SEED_MAX_ATTEMPTS=${DB_SEED_MAX_ATTEMPTS}
EOF

  echo
  print_success ".env wurde geschrieben."

  assert_env_sane
fi

echo
echo -e "${CYAN}──────────────────────────${RESET}"
echo -e "${CYAN} Zusammenfassung${RESET}"
echo -e "${CYAN}──────────────────────────${RESET}"

SERVER_IPV4_SUMMARY="$(detect_primary_ipv4 || true)"
if [[ -z "${SERVER_IPV4_SUMMARY// }" ]]; then
  SERVER_IPV4_SUMMARY="-"
fi

DB_HOST_SUMMARY="$(read_env_value "$ENV_FILE" DB_HOST || echo "-")"
DB_PORT_SUMMARY="$(read_env_value "$ENV_FILE" DB_PORT || echo "-")"
DB_NAME_SUMMARY="$(read_env_value "$ENV_FILE" DB_NAME || echo "-")"
DB_USER_SUMMARY="$(read_env_value "$ENV_FILE" DB_USER || echo "-")"
ASPNET_SUMMARY="$(read_env_value "$ENV_FILE" ASPNETCORE_ENVIRONMENT || echo "-")"
CORS_SUMMARY="$(read_env_value "$ENV_FILE" CORS_ALLOWED_ORIGINS || echo "-")"
VITE_SUMMARY="$(read_env_value "$ENV_FILE" VITE_API_BASE_URL || echo "-")"
SEED_EMAIL_SUMMARY="$(read_env_value "$ENV_FILE" SEED_ADMIN_EMAIL || echo "-")"
SEED_INIT_SUMMARY="$(read_env_value "$ENV_FILE" SEED_INITIATIVE_NAME || echo "-")"
SEED_ATTEMPTS_SUMMARY="$(read_env_value "$ENV_FILE" DB_SEED_MAX_ATTEMPTS || echo "-")"

echo "Environment:            ${ASPNET_SUMMARY}"
echo "Server-IP erkannt:      ${SERVER_IPV4_SUMMARY}"
echo "VITE_API_BASE_URL:      ${VITE_SUMMARY}"
echo "Datenbankstatus:        ${DB_RESET_STATUS}"

FRONTEND_ORIGIN_SUMMARY="${FRONTEND_ORIGIN:-}"
if [[ -z "${FRONTEND_ORIGIN_SUMMARY// }" ]]; then
  if [[ -n "${CORS_SUMMARY// }" ]]; then
    FRONTEND_ORIGIN_SUMMARY="${CORS_SUMMARY%%,*}"
  else
    FRONTEND_ORIGIN_SUMMARY="-"
  fi
fi
echo "Frontend-Origin:        ${FRONTEND_ORIGIN_SUMMARY}"
echo "CORS_ALLOWED_ORIGINS:   ${CORS_SUMMARY}"

cors_mode="eingeschränkt"
if [[ "${ASPNET_SUMMARY}" == "Development" && -z "${CORS_SUMMARY// }" ]]; then
  cors_mode="alle Origins erlaubt (Development + leer)"
elif [[ "${CORS_SUMMARY}" == "*" ]]; then
  cors_mode="alle Origins erlaubt (*)"
fi
echo "CORS Modus:             ${cors_mode}"

echo
echo "DB_HOST:                ${DB_HOST_SUMMARY}"
echo "DB_PORT:                ${DB_PORT_SUMMARY}"
echo "DB_NAME:                ${DB_NAME_SUMMARY}"
echo "DB_USER:                ${DB_USER_SUMMARY}"
echo "SEED_ADMIN_EMAIL:       ${SEED_EMAIL_SUMMARY}"
echo "SEED_INITIATIVE_NAME:   ${SEED_INIT_SUMMARY}"
echo "DB_SEED_MAX_ATTEMPTS:   ${SEED_ATTEMPTS_SUMMARY}"

echo
print_warning "Passwörter werden hier nicht angezeigt (stehen in .env)."

check_required_env_keys

echo
print_info "Lokale URLs (Compose Standard):"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:5000"
echo "  MariaDB:   localhost:3306"
echo "  phpMyAdmin:http://localhost:8081"
echo "  NPM Admin: http://localhost:81"

echo
if ask_yes_no "Docker Container jetzt starten?" "Y"; then
  if detect_compose_cmd; then
    print_info "Compose: ${COMPOSE_CMD[*]}"
    if ask_yes_no "Images neu bauen (--build)?" "Y"; then
      print_info "Starte Container (mit Build)..."
      "${COMPOSE_CMD[@]}" up -d --build
    else
      print_info "Starte Container..."
      "${COMPOSE_CMD[@]}" up -d
    fi
    echo
    "${COMPOSE_CMD[@]}" ps
    echo
    print_success "Container laufen (wenn oben keine Fehler stehen)."
  else
    print_error "Docker Compose wurde nicht gefunden."
    print_info "Installiere Docker + Compose oder starte später manuell: docker compose up -d --build"
  fi
else
  print_info "Docker wurde nicht gestartet."
  print_info "Später starten mit: docker compose up -d --build"
fi

echo
print_success "Setup abgeschlossen."