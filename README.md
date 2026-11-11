# Super Meat Boy · Web

Original Super Meat Boy Steam Windows build 3241924 (game version 1.2.5), executed in a browser using the Boxedwine x86/Wine WebAssembly runtime. This is not a GameMaker HTML5 export or a gameplay recreation.

Game and Wine archives download automatically in sequential 8 MiB parts. Every part is checked against the SHA-256 in `assets.json`. Versioned resources use a Cache-First service worker. The first preparation transfers approximately 523 MiB. The runtime keeps compressed archives in memory and lets Wine read their contents; it does not decode every audio resource in the shell.

The original Windows program uses Direct3D 9 and d3dx9_43. This deployment includes Boxedwine's WebGL-compatible WineD3D filesystem v30. The runtime is the single-threaded JIT build, because the multi-threaded candidate stalled during this game's initialization. The game retains its original timing and physics. Execution speed and memory requirements can still limit mobile devices.

## Controls

Arrow keys move, Space jumps/selects, Shift runs, Escape goes back. Pointer controls preserve independent fingers and held keys. Precise left/right buttons are the default; a dynamic circular stick is available in settings. Input goes through SDL's registered keyboard-event path because this binary does not export a direct key-state API. No input timer or gameplay rewrite is added.

## Saves

Wine's writable overlay is mounted in IndexedDB through IDBFS with auto-persistence and is restored before the program starts. Original `UserData/savegame.dat` and `Reg0.dat` are used. Native writes are retained; the shell does not create checkpoints. Settings provide a JSON backup wrapping the native bytes. Import validates allowed filenames, byte values, native version header, and the tested build's 7336-byte save length, and applies it before the next launch. It does not claim to validate undocumented gameplay fields or a proprietary checksum.

Storage persistence is requested, not guaranteed. Keep exported backups. A service-worker update changes the resource cache independently of the save databases. An interrupted database transaction does not replace its previously committed value.

## Licenses and source

- Original game binaries and assets retain their original copyrights. Their public distribution for this project was explicitly authorized by the person commissioning the project, who confirmed they are the developer or an authorized rights holder. They are not relicensed under the runtime's GPL.
- Boxedwine is GPL-2.0. Runtime build: upstream master build 127, commit `a5b159507a83422de89719c7bd52f2a97228acb8`. Corresponding source, including build instructions, bundled libraries and Wine modifications, is supplied at [`sources/Boxedwine-a5b1595.zip`](sources/Boxedwine-a5b1595.zip). Local changes are limited to the separately readable shell/bridge JavaScript; the WASM binary is unchanged. See [`licenses/Boxedwine-GPL-2.0.txt`](licenses/Boxedwine-GPL-2.0.txt).
- Wine 11 filesystem v30 is from [the official Boxedwine distribution](https://boxedwine.org/v2/30/TinyCore15Wine11.0-web.zip). Its original SHA-256 is `4a3ff6df91496e0331887191e04a7dd86eedef2844854be889aeb4e2ccd5f885`. Preserved notices are in [`licenses/Wine-filesystem-notices.json`](licenses/Wine-filesystem-notices.json). Corresponding package/source provenance and reproducible patches are in the bundled Boxedwine source under `tools/buildWine/RELEASE-v30.md`, `RELEASE-v28.md`, and the Wine build manifests. The official companion media source archive is [TinyCore15WineBase-media-sources.zip](https://boxedwine.org/v2/28/TinyCore15WineBase-media-sources.zip).
- Press Start 2P supports Cyrillic and is distributed under the SIL Open Font License; see [`fonts/OFL.txt`](fonts/OFL.txt).
- Integration code is distributed under GPL-2.0, consistently with the adapted Boxedwine shell.

`npm test` runs input-state and save-import validation checks. Browser QA is performed in the Codex in-app browser. A resized viewport is not a test on a physical iPhone or Android device. No complete-game or real-device audio compatibility claim is made.

Private Steam user data, existing progress and Steam account configuration are excluded from the public archive.
