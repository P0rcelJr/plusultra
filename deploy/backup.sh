#!/bin/sh
# Nightly logical backup of the database into the `backups` volume, keeping 14 days.
# Copying these dumps off the VPS is still pending (decisions doc, assumption A3).
set -eu
while true; do
  stamp="$(date +%F)"
  pg_dump -h db -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "/backups/plusultra-${stamp}.sql.gz"
  find /backups -name 'plusultra-*.sql.gz' -mtime +14 -delete
  echo "backup written: plusultra-${stamp}.sql.gz"
  sleep 86400
done
