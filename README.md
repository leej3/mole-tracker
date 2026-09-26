# Mole Tracker

Mole Tracker is a personal recordkeeping app for documenting skin marks over
time and preparing a history to discuss with a medical professional. It does
not diagnose skin conditions.

## Privacy and backups

The web app stores profile data, records, notes, and photos in a SQLite database
inside the current browser. It does not send that data to a server. Browser data
can be lost if site storage is cleared, so download a backup from **Settings →
Privacy & Data** and keep it somewhere safe. A backup is a SQLite file containing
all app records and photos; restoring it replaces the current browser's data.

Photos are resized in the browser when supported. On compatible phones, **Take
or Add Photo** opens the camera first; the browser may still offer a saved-photo
chooser.

## Local development

```sh
npm ci
npm start
```

## GitHub Pages

The `main` branch builds the Expo web app and deploys `dist/` to Cloudflare
Pages using the website-management deployment convention. The workflow needs
the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.
