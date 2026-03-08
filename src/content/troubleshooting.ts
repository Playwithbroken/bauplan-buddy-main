export const troubleshootingGuides = {
  login: {
    title: "Anmeldeprobleme lösen",
    content: `
## Häufige Anmeldeprobleme

### Passwort vergessen
1. Klicken Sie auf "Passwort vergessen" 
2. E-Mail-Adresse eingeben
3. Link in E-Mail befolgen
4. Neues Passwort festlegen

### Konto gesperrt
- **Ursache**: Zu viele fehlgeschlagene Anmeldeversuche
- **Lösung**: 15 Minuten warten oder Admin kontaktieren
- **Vorbeugung**: Korrektes Passwort verwenden

### E-Mail nicht erhalten
1. Spam-Ordner überprüfen
2. E-Mail-Adresse korrekt eingegeben?
3. Firmen-Firewall blockiert möglicherweise
4. Support kontaktieren

### Browser-Probleme
- **Cache leeren**: Strg+F5 drücken
- **Cookies aktivieren**: In Browser-Einstellungen
- **JavaScript aktivieren**: Erforderlich für Anwendung
- **Aktuellen Browser verwenden**: Chrome, Firefox, Safari, Edge

## Schnelle Lösungen
- Privaten/Inkognito-Modus testen
- Anderen Browser probieren
- VPN deaktivieren
- Antivirenprogramm temporär deaktivieren
    `,
    tags: ["Anmeldung", "Passwort", "Browser"],
    difficulty: "Anfänger",
    readTime: "3 min"
  },
  sync: {
    title: "Synchronisationsprobleme",
    content: `
## Kalender-Synchronisation

### Termine werden nicht synchronisiert
1. **Verbindung prüfen**
   - Internet verfügbar?
   - Externe Kalender erreichbar?

2. **Berechtigung überprüfen**
   - OAuth-Token noch gültig?
   - Kalender-Zugriff erlaubt?

3. **Manuelle Synchronisation**
   - "Jetzt synchronisieren" klicken
   - Status-Meldungen beachten

### Doppelte Termine
- **Ursache**: Mehrfache Synchronisation
- **Lösung**: Duplikate automatisch bereinigen lassen
- **Einstellung**: "Duplikate zusammenführen" aktivieren

### Änderungen gehen verloren
- **Problem**: Konflikte bei gleichzeitiger Bearbeitung
- **Lösung**: Prioritätsregeln konfigurieren
- **Tipp**: Immer in einem System bearbeiten

## Performance-Probleme

### Langsame Anwendung
1. **Browser-Cache leeren**
2. **Zu viele Tabs schließen**
3. **Browser-Erweiterungen deaktivieren**
4. **Internetverbindung prüfen**

### Timeouts bei großen Datenmengen
- Weniger Daten auf einmal laden
- Filter verwenden
- Archivierte Projekte ausblenden

## Mobile App Probleme

### App stürzt ab
1. App neu starten
2. Gerät neu starten
3. App-Update installieren
4. App neu installieren

### Offline-Modus funktioniert nicht
- Daten vor Offline-Gang synchronisieren
- Ausreichend Speicherplatz sicherstellen
- App-Berechtigung für lokale Speicherung prüfen
    `,
    tags: ["Synchronisation", "Performance", "Mobile"],
    difficulty: "Fortgeschritten",
    readTime: "5 min"
  },
  data: {
    title: "Datenverlust vermeiden",
    content: `
## Backup und Wiederherstellung

### Automatische Backups
- **Tägliche Sicherung**: Alle Projektdaten
- **Cloud-Speicher**: Sichere Ablage
- **Versionierung**: Mehrere Sicherungsstände

### Manuelle Sicherung
1. "Einstellungen" → "Backup"
2. "Backup erstellen" klicken
3. Lokale Datei herunterladen
4. Sicher aufbewahren

### Datenwiederherstellung
1. Support kontaktieren
2. Backup-Zeitpunkt nennen
3. Betroffene Daten spezifizieren
4. Wiederherstellung abwarten

## Versehentliche Löschung

### Termine wiederherstellen
- **Papierkorb**: Gelöschte Termine 30 Tage verfügbar
- **Wiederherstellen**: Ein Klick genügt
- **Endgültig löschen**: Nach 30 Tagen automatisch

### Projekte reaktivieren
- Admin kann gelöschte Projekte wiederherstellen
- Wichtig: Schnell handeln (7 Tage Frist)
- Alle Projektdaten bleiben erhalten

### Dokumente retten
- Versionsverwaltung nutzen
- Ältere Version wiederherstellen
- Bei wichtigen Dokumenten: Support kontaktieren

## Präventive Maßnahmen
- Regelmäßige Backups erstellen
- Wichtige Daten zusätzlich extern sichern
- Löschvorgänge sorgfältig prüfen
- Team über Backup-Verfahren informieren
    `,
    tags: ["Backup", "Datenrettung", "Sicherheit"],
    difficulty: "Fortgeschritten",
    readTime: "4 min"
  }
};

export const faqData = {
  general: [
    {
      question: "Welche Browser werden unterstützt?",
      answer: "Bauplan Buddy funktioniert optimal mit aktuellen Versionen von Chrome, Firefox, Safari und Edge. Internet Explorer wird nicht unterstützt.",
      category: "System",
      tags: ["Browser", "Kompatibilität"]
    },
    {
      question: "Kann ich Bauplan Buddy offline nutzen?",
      answer: "Ja, die mobile App bietet Offline-Funktionalität. Termine und Projektdaten werden lokal gespeichert und bei nächster Internetverbindung synchronisiert.",
      category: "Mobile",
      tags: ["Offline", "Synchronisation"]
    },
    {
      question: "Wie viele Benutzer können gleichzeitig arbeiten?",
      answer: "Unbegrenzt. Bauplan Buddy unterstützt beliebig viele gleichzeitige Benutzer. Die Performance hängt von Ihrem Internetanschluss ab.",
      category: "Performance",
      tags: ["Benutzer", "Kapazität"]
    }
  ],
  appointments: [
    {
      question: "Wie weit im Voraus kann ich Termine planen?",
      answer: "Termine können unbegrenzt weit in die Zukunft geplant werden. Für wiederkehrende Termine empfehlen wir maximal 2 Jahre im Voraus.",
      category: "Terminplanung",
      tags: ["Zukunft", "Limite"]
    },
    {
      question: "Können externe Personen Termine einsehen?",
      answer: "Nur wenn Sie explizit eingeladen werden. Kunden erhalten bei Bedarf begrenzte Einsicht in ihre eigenen Termine.",
      category: "Berechtigung",
      tags: ["Externe", "Sicherheit"]
    },
    {
      question: "Was passiert bei Terminkonflikten?",
      answer: "Bauplan Buddy erkennt Konflikte automatisch und warnt Sie. Sie erhalten Vorschläge für alternative Zeiten oder können Prioritäten festlegen.",
      category: "Konflikte",
      tags: ["Überschneidung", "Automatik"]
    }
  ],
  projects: [
    {
      question: "Wie viele Projekte kann ich gleichzeitig verwalten?",
      answer: "Es gibt keine Begrenzung der Projektanzahl. Für bessere Übersicht können Sie Projekte nach Status filtern oder archivieren.",
      category: "Kapazität",
      tags: ["Limite", "Verwaltung"]
    },
    {
      question: "Können mehrere Personen an einem Projekt arbeiten?",
      answer: "Ja, Projekte unterstützen Teamarbeit. Sie können Rollen vergeben und Berechtigungen individuell festlegen.",
      category: "Teamarbeit",
      tags: ["Zusammenarbeit", "Berechtigung"]
    },
    {
      question: "Wie archiviere ich abgeschlossene Projekte?",
      answer: "Klicken Sie im Projektdashboard auf 'Projekt archivieren'. Archivierte Projekte bleiben durchsuchbar, aber nicht in der aktiven Liste.",
      category: "Archivierung",
      tags: ["Abschluss", "Aufräumen"]
    }
  ],
  technical: [
    {
      question: "Wo werden meine Daten gespeichert?",
      answer: "Alle Daten werden in deutschen Rechenzentren nach DSGVO-Standards gespeichert. Zusätzlich erstellen wir täglich verschlüsselte Backups.",
      category: "Datenschutz",
      tags: ["Speicherort", "DSGVO", "Sicherheit"]
    },
    {
      question: "Kann ich meine Daten exportieren?",
      answer: "Ja, Sie können alle Ihre Daten in verschiedenen Formaten (PDF, Excel, CSV) exportieren. Gehen Sie zu Einstellungen > Datenexport.",
      category: "Export",
      tags: ["Datenportabilität", "Backup"]
    },
    {
      question: "Gibt es eine API für Integrationen?",
      answer: "Ja, Bauplan Buddy bietet eine REST-API für Integrationen mit anderen Systemen. Dokumentation finden Sie im Entwicklerbereich.",
      category: "Integration",
      tags: ["API", "Entwicklung"]
    }
  ]
};