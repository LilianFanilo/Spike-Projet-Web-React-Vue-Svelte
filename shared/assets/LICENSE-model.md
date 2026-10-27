# Modèle 3D : `model.glb`

- **Modèle** : Suzanne, le modèle de test de Blender
- **Source** : [KhronosGroup/glTF-Sample-Assets — Models/Suzanne](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Suzanne)
- **Auteur** : Norbert Nopper / UX3D (2017)
- **Licence** : [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode), domaine public, sans attribution obligatoire

## Modifications apportées par `build-model.ts`

- Les textures, images et samplers ont été retirés.
- Le matériau est devenu blanc et teintable : `baseColorFactor` 1, 1, 1, 1, `metallicFactor` 0, `roughnessFactor` 0,5.
- Le modèle est emballé en GLB, en un seul fichier.

La géométrie n'a pas été modifiée.
