# Fe Kingdoms visual asset

`web/assets/fe-kingdoms-logo.png` is the original approved Fe Kingdoms logo concept, supplied through the owner's Library. It is an AI-generated 1536 x 1024 RGBA PNG. SHA-256: `005ec6b3b4c995ce26e73bda6c162248179781eedbbbb4934ab0149ab1ae492f`. The project copy is byte-for-byte identical to the approved original. The browser uses a CSS polygon to mask the outside glow; the artwork itself has not been edited. The logo is decorative in the game header; the adjacent real heading supplies the accessible name.

`docs/assets/dragonstales-medallion.png` is a byte-identical copy of the existing DragonsTales studio medallion, visually inspected in its source project. SHA-256: `61e7b229a7a81f5047de12ffdb86699474ec566a83609548b94e7659f8913059`. It is included here as studio branding, not as a gameplay screenshot.

The Fe Kingdoms logo and DragonsTales name and medallion are project branding, excluded from the MIT code license. Permission to use this approved mark in this game does not automatically grant third parties a branding license. Check provenance and rights for all other assets before publication.

## Display and verification, 2026-11-16

An isolated localhost browser preview was inspected at the default desktop viewport and at 390 x 844 CSS pixels. The logo and readable text heading appeared without obstructing the toolbar at both widths; the viewport was reset afterward. This was a targeted layout check, not a human playtest. The full `scripts/verify.ps1` aggregate passed in the isolated copy, including a real HTTP test of the exact PNG bytes, dimensions, content type and rejected traversal path. UI unit tests are mocked and do not replace a browser or human playtest. The existing Linux preview archive predates this logo integration and has not been rebuilt.

GitHub documentation references use paths relative to each document. The game header masks the logo’s outer glow with CSS; GitHub Markdown displays the original PNG without that game-specific mask. All four manga panels are approved and included; the original text storyboards have been replaced with document-relative image links.

On 2026-11-16, a case-sensitive path audit checked every Markdown and HTML image reference in the isolated review copy, and a local browser image-tag preview loaded the crest and medallion from their document-relative paths. This was not a GitHub rendering or human playtest. The original approved game logo and studio medallion were visually inspected; the full offline project verification also passed in that copy.

## Approved opening manga panel, 2026-11-17

`docs/assets/fek-manga-01-bread-departs.png` is the original AI-generated opening panel approved by Eric and saved by him to Downloads. It is copied without modification (1536 x 1024 PNG, 3,750,261 bytes). SHA-256: `646442dbdc96840ec61b4995cb9f228571bc46a9d40f5488ddeb3c5c3201f4a1`. Its source Library filename was `fek-manga-01-bread-departs-draft.png`. Visual inspection confirmed the crowned blue castle, departing bread and approved caption. The copy hash matches the supplied original.

## Approved remaining manga panels, 2026-11-18

Eric approved panels 2–4 for incorporation and GitHub publication on 2026-11-18. These AI-generated 1536 × 1024 PNGs were generated against the approved opening panel, visually inspected, and copied byte-for-byte from the delivered review originals. No asset modification was made during integration.

`docs/assets/fek-manga-02-logistics.png`: 3,875,934 bytes; SHA-256 `df795d0412732d13077a1355dca6558436132488c900229a79cd112a40d4cdb9`.

`docs/assets/fek-manga-03-opponent.png`: 3,614,934 bytes; SHA-256 `f25421b758a313d26bb000a2e380e3c7fa27be51163241dc3ba11dacf88acbe7`.

`docs/assets/fek-manga-04-closing.png`: 3,793,429 bytes; SHA-256 `a97c2887ff1daf0aacfd55ed970b7adf62db3c54b55629784b402149babb044b`.
