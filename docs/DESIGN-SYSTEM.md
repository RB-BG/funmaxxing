# Design system

De vibe: jeugdig, expressief, indie-web / vroege 00s (WordArt, pixel-fonts, retro-chrome,
eigen cursor, geluidjes) maar functioneel: de agenda-lijst blijft scanbaar.

## Palette

Gedefinieerd als CSS-variabelen in [`src/index.css`](../src/index.css) (`:root`) en gemapt naar
Tailwind-kleuren in het `@theme inline`-blok. Bewust **niet** het werk-brandgroen.

| Token | Hex | Tailwind | Gebruik |
|---|---|---|---|
| `--cream` | `#f5f1e8` | `bg-cream` | basis/achtergrond (oud-web gevoel) |
| `--ink` | `#1a1423` | `text-ink` | tekst, randen, schaduwen |
| `--hot` | `#ff2e93` | `text-hot` / `bg-hot` | hot pink, primair accent |
| `--cyan` | `#1fe0c8` | `bg-cyan` | electric cyan |
| `--acid` | `#ffd23f` | `bg-acid` | acid yellow, highlights |
| `--grape` | `#6320ee` | `text-grape` | links / diep accent |

### Per-app accent (Lowlands-patroon)
`--app-accent` en `--app-accent-2` zijn de **verwisselbare** accenten. Defaults staan in `:root`
(agenda = pink/cyan). Een app overschrijft ze met `skinVars(SKINS.<id>)` uit
[`src/ui/theme.ts`](../src/ui/theme.ts) op z'n root. Tailwind: `bg-app`, `text-app`, `bg-app-2`.
Kleuren aanpassen = hex in `:root` wijzigen; een nieuwe app-skin = entry in `SKINS`.

## Typografie
Leesbaarheid eerst: het pixel-font wordt alleen groot ingezet, alle UI-tekst is Geist.
- **Geist** (`font-sans`) — alle UI-tekst: knoppen, filters, ticker, event-details, koppen.
- **VT323** (`font-display`) — alleen de grote hero-WordArt en losse cijfers/tellers (flavor,
  goed leesbaar op groot formaat). Press Start 2P is bewust verwijderd (te onleesbaar op kleine maat).

## Utilities (in `index.css`)
- `.bezel` / `.bezel-sm` — chunky retro rand + harde offset-schaduw (`box-shadow` in ink).
- `.text-stroke-ink` — ink-outline op tekst.
- Body heeft een subtiele dotted-grid wallpaper en, als de custom cursor actief is, `cursor:none`
  via de class `has-custom-cursor` (door `CustomCursor` op `document.body` gezet).

## Layout (Steam-geïnspireerd)
Twee kolommen op desktop: `grid lg:grid-cols-[minmax(0,1fr)_300px]`. Links de content
(hero + dag-gegroepeerde events), rechts een **sticky** sidebar (`lg:sticky lg:top-4`) met de
panelen Filters (met aantallen), Selectie (download/wis) en Venues (kleur-legenda). Op mobiel
stapelt de sidebar bovenaan (`order-first`) en verschijnt onderaan een smalle download-balk zodra
er iets gekozen is. Panelen zijn vlak en uitgelijnd (`border-2 border-ink`, consistente padding),
geen schuine schaduwen, zodat lijnen recht op elkaar aansluiten.

## Gedeelde primitives ([`src/ui/`](../src/ui))
- **`WordArt`** — gradient-fill + ink-outline + drop-shadow kop. `<WordArt text="..." className="text-5xl" />`.
- **`MarqueeBar`** — slanke, leesbare ticker (`react-fast-marquee`, geen emoji); statisch onder reduced-motion.
- **`Panel` / `RetroPanel` / `RetroButton`** ([`Retro.tsx`](../src/ui/Retro.tsx)) — `Panel` = vlak blok
  met gekleurde header-strip (Steam-stijl); `RetroButton` = leesbare knop die "indrukt" bij klik.
- **`CustomCursor`** — spring-volgende cursor (ring + dot) in `var(--app-accent)`. Alleen op
  fine-pointer en niet bij reduced-motion.
- **`ErrorBoundary`** — vangt render-fouten zodat één kapotte app niet de hele pagina blankt.
- **`BootScreen`** — nep-BIOS/CRT cold-open die zichzelf typt (rAF-gedreven) en daarna met een
  CRT-power-off de agenda onthult. Eén keer per sessie, skipbaar (toets/klik), uit bij
  reduced-motion, met een safety-timeout zodat hij nooit blokkeert. Opstapje naar de desktop-shell.
- **Geluid** — `SoundProvider` (Web Audio synth, geen assets) + `useSound()` uit
  [`sound.ts`](../src/ui/sound.ts). `play("hover" | "click" | "select" | "deselect" | "add" | "whoosh")`.
  Mute wordt bewaard in `localStorage` (`funmax-muted`); toggle zit in de agenda-header.

## Toegankelijkheid
- **`prefers-reduced-motion`** ([`useReducedMotion`](../src/ui/useReducedMotion.ts)): cursor en
  stickers uit, marquee statisch, confetti overgeslagen. Respecteer dit in nieuwe animaties.
- **Geluid** staat standaard aan met een duidelijke mute-knop; nooit autoplay van lange audio.
- Media-queries lopen via [`useMediaQuery`](../src/ui/useMediaQuery.ts) (`useSyncExternalStore`,
  geen setState-in-effect).
- Aandachtspunt voor later: event-cards zijn klikbare `div`'s (zoals in het origineel); voor
  volledige toetsenbordnavigatie kunnen ze een `role="button"` + `onKeyDown` krijgen.
