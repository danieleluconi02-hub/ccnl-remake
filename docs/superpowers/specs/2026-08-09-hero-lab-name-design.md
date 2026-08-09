# Hero della homepage: il nome del laboratorio come titolo

Data: 2026-08-09 · Stato: approvato e implementato

## Problema

Nella prima schermata della homepage il **nome del laboratorio non compare mai**.
L'H1 dice *"Mapping the Frontiers of Computational Cognitive Neuroscience"*: contiene
le parole del campo di ricerca, non il nome dell'ente. L'unico segnale d'identità
sopra la piega è il wordmark "CCNLab" nell'header, alto 46px.

La prima occorrenza del nome esteso è nella sezione About, sotto la piega.

Il pubblico dichiarato (accademici, dottorandi, post-doc, giornalisti) arriva da una
citazione o da un link e deve confermare in mezzo secondo di essere nel posto giusto.

Effetto collaterale misurato: le parole "computational cognitive neuroscience"
compaiono nell'H1, nel `<title>`, nella meta description e nel lead. L'H1 spende
5 righe di serif display per informazione già presente due righe sotto.

## Decisione

Opzione **B1** — il nome diventa il titolo, lo slogan viene eliminato.
Scartate: B2 (slogan come sottotitolo: *"Mapping the frontiers"* privato del nome
del campo non dice nulla) e B3 (acronimo come display: illeggibile a chi arriva
la prima volta, cioè l'opposto dell'obiettivo).

## Cambiamenti

### 1. H1 dell'hero — `index.html`

```
Computational
Cognitive Neuroscience
Lab                      ← <span class="italic text-accent-red">
```

- Eyebrow, lead, CTA e metriche restano invariati. Nessuna riscrittura di copy.
- `Lab` in crimson riprende il wordmark, che porta la stessa distinzione
  (nel PNG "Lab" è nell'oro storico #F1C40F, ora reso in `var(--accent)`).
- Divisione in righe verificata: 3 righe da 1440px in su, 4 sotto
  (`Cognitive Neuroscience` non entra nella colonna stretta e si divide).
  Entrambe entrano nella prima schermata. La variante a 2 righe è stata
  scartata: `Computational Cognitive` supera la colonna già a 1280.

### 2. Hero: una sola CTA

Resta `Explore Research` → `research.html`.
Eliminato `About the Lab` → `#about`: portava alla sezione immediatamente
successiva, raggiungibile scrollando.

**Freccia: mantenuta** (opzione A). La richiesta iniziale era di toglierla per
coerenza, ma la misura diceva il contrario: 8 `.cta-link` su 9 nel sito hanno la
freccia, e l'unico senza era proprio `About the Lab`, che viene eliminato.
Toglierla avrebbe reso `Explore Research` l'unica CTA senza freccia.

### 3. CTA della sezione About

`Research overview` → `research.html` diventa `Meet the team` → `people.html`.

Motivo: puntava alla stessa destinazione della CTA dell'hero, a una schermata di
distanza. Il corpo della homepage linka **una sola pagina interna** (`research.html`,
due volte) e nessun link a team, playground, news o posizioni aperte. Quello slot
era l'unico disponibile, sprecato in un doppione.

## Vincoli da preservare

- H1 dell'hero strettamente maggiore di ogni H2 (32px) da 1024×640 a 1920×1080
- hero completo (titolo, lead, CTA, metriche, figura e didascalia) dentro la
  prima schermata a tutte e sei le misure
- nessun link morto
- bilanciamento tag e zero errori console sulle 16 pagine

## Fuori ambito

Il logo non viene modificato. `CCN` è disegnato in grassetto (55% di densità
d'inchiostro) e `Lab` in tondo chiaro (28%): a 9px di altezza-maiuscola il primo
impasta e il secondo tiene la forma. È una proprietà dell'artwork, non del
rendering — verificato che `IMG + filter` e `MASK + fill` danno risultati
indistinguibili, e che nero, crimson e crimson scuro hanno la stessa definizione.

## Esito della verifica

| viewport | H1 | H2 max | righe H1 | metriche | didascalia | prima schermata |
|---|---|---|---|---|---|---|
| 1024×640  | 40.0 | 32 | 4 | 612 | 602 | OK |
| 1280×720  | 40.3 | 32 | 3 | 615 | 665 | OK |
| 1280×800  | 44.8 | 32 | 4 | 692 | 727 | OK |
| 1440×900  | 50.4 | 32 | 3 | 748 | 805 | OK |
| 1680×1050 | 58.8 | 32 | 3 | 846 | 922 | OK |
| 1920×1080 | 60.0 | 32 | 3 | 865 | 943 | OK |

Link interni nel corpo della homepage: da `research.html ×2` a
`research.html ×1` + `people.html ×1`.
