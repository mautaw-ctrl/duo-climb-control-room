# Hullet's built-in model library

Hullet uses real authored assets. Only models with suitable redistributable licences are bundled. Each external file stays in its glTF-Binary form.

| Asset | Credit | Licence |
|---|---|---|
| Jesus, original particle field | Hullet original `jesus-figure.js`, generated from `jesus-figure.png` | Project artwork |
| Fox | PixelMannen (model), tomkranis (rig/animation), AsoboStudio and scurest (glTF conversion) | CC0 for model, CC BY 4.0 for rig/conversion |
| CesiumMan | Cesium | CC BY 4.0 (Cesium names and logos retain trademark protections) |
| CesiumMilkTruck | Cesium | CC BY 4.0 (Cesium trademark remains theirs) |
| BoxAnimated | Cesium | CC BY 4.0 |
| SunglassesKhronos | Darmstadt Graphics Group GmbH, Eric Chadwick | CC BY 4.0 (Khronos marks remain theirs) |
| ToyCar | Guido Odendahl, Eric Chadwick | CC0 |
| BoomBox | Microsoft | CC0 |
| SheenChair | Wayfair LLC, Eric Chadwick | CC0 |
| IridescenceLamp | Wayfair LLC, Eric Chadwick | CC BY 4.0 |
| Lantern | Microsoft, sbtron, Frank Galligan | CC0 |

// Newly bundled Khronos glTF sample models, loaded from the model-frontpage/models
// folder on demand. A visitor never downloads these until selecting them.
// See each upstream README for original source and licensing.
| RiggedFigure | Cesium | CC BY 4.0 |
| ScatteringSkull | Vladimir Petkovic | CC0 |
| MaterialsVariantsShoe | Shopify | CC BY 4.0 |
| WaterBottle | Microsoft | CC0 |
| GlamVelvetSofa | Wayfair LLC; Eric Chadwick | CC BY 4.0 |
| AnisotropyBarnLamp | Wayfair LLC; Eric Chadwick | CC BY 4.0 |
| Avocado | Microsoft | CC0 |
| DiffuseTransmissionTeacup | Polyhaven.com; Eric Chadwick | CC0 |
| IridescenceAbalone | Abby Crawford; Eric Chadwick | CC BY 4.0 |
| IridescentDishWithOlives | Wayfair LLC; Eric Chadwick | CC BY 4.0 |
| IridescenceSuzanne | UX3D, Mathias Kanzler; Pascal Schoen | CC0 |
| ClearCoatCarPaint | Eric Chadwick | CC0 |
| Thunderfury | johnskyrim (fan recreation; NOT a verified Blizzard original) | Used through creator-hosted Sketchfab embed. No rehosted model file |

Source of the glTF examples: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models

Licence references: https://creativecommons.org/licenses/by/4.0/ and https://creativecommons.org/publicdomain/zero/1.0/

The website includes **22 locally hosted glTF assets**, the original Jesus particle field, and the creator-hosted Thunderfury viewer. That's **25 options** in the model dropdown. The GLB files are downloaded only upon selection. No Sketchfab OAuth or login is required to browse them.

The large 3D assets are committed by `.github/workflows/bundle-hullet-models.yml` after GitHub downloads and checks their GLB headers. The bundling workflow validates downloaded GLB headers and commits the licensed assets. All 22 glTF files were present when the 25-option selector was released.

| Sovietna vs Leiching · Ragnarok | https://sketchfab.com/3d-models/sovietna-vs-leiching-ragnarok-will-started-601c179398d5467383827647b3eb70c4 | Creator-hosted Sketchfab embed; not downloaded or redistributed |
