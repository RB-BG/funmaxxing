# Een nieuw appje toevoegen

Elk "appje" (bijv. een tv-zender of radio) is een zelfstandige feature-module onder `src/apps/`,
ontsloten via de shell-registry. Stappenplan:

## 1. Maak de app-map
```
src/apps/tv/
  TvApp.tsx          # default export, de entry-component
  components/        # eigen componenten
```
`TvApp.tsx` moet een **default export** hebben (nodig voor `React.lazy`):
```tsx
export function TvApp() {
  return <div style={skinVars(SKINS.tv)}>...</div>
}
export default TvApp
```

## 2. Geef de app een skin
Voeg in [`src/ui/theme.ts`](../src/ui/theme.ts) een entry toe aan `SKINS`:
```ts
export const SKINS: Record<string, AppSkin> = {
  agenda: { accent: "var(--hot)", accent2: "var(--cyan)" },
  tv:     { accent: "var(--grape)", accent2: "var(--acid)" },
}
```
Zet `style={skinVars(SKINS.tv)}` op de root van je app; alle `var(--app-accent)` / `bg-app` /
`text-app` binnen die subtree pakken dan automatisch de juiste kleuren.

## 3. Registreer de app
Voeg in [`src/shell/AppRegistry.ts`](../src/shell/AppRegistry.ts) een entry toe:
```ts
{
  id: "tv",
  name: "Funmax TV",
  icon: "📺",
  Component: lazy(() => import("@/apps/tv/TvApp")),
}
```
De `lazy()`-import zorgt dat de app in een eigen JS-chunk komt (alleen geladen wanneer geopend).

## 4. Ontsluit de app
Zolang er nog geen desktop-shell is, kies je in [`App.tsx`](../src/App.tsx) welke app boot
(nu `APPS[0]`). Wanneer de desktop-shell er is, rendert die automatisch alle apps uit `APPS`
als icoontjes/vensters — dan hoef je hier niets meer te wijzigen.

## 5. Herbruik de gedeelde laag
- UI-primitives uit [`src/ui/`](../src/ui): `WordArt`, `MarqueeBar`, `RetroPanel`/`RetroButton`,
  `useSound()` (geluidseffecten), `useReducedMotion()`.
- Functionele helpers uit [`src/lib/`](../src/lib): `cn`, en alles wat je app-overstijgend wilt delen.
- Houd app-specifieke logica binnen `apps/<naam>/`; zet iets pas in `ui/` of `lib/` als een
  tweede app het ook gebruikt.

## 6. Verifieer
`npm run build` (TypeScript + bundel, check de eigen chunk) en `npm run lint` moeten groen zijn.
