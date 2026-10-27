// Produit shared/assets/model.glb à partir de Suzanne (Khronos glTF-Sample-Assets, CC0-1.0) :
// textures retirées, matériau blanc teintable, emballé en GLB. À lancer une seule fois.
// Usage : node shared/assets/build-model.ts

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SOURCE = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Suzanne/glTF/";
const OUT = fileURLToPath(new URL("./model.glb", import.meta.url));
const MAX_BYTES = 1024 * 1024;

async function download(name: string): Promise<Response> {
  const res = await fetch(SOURCE + name);
  if (!res.ok) throw new Error(`Téléchargement de ${name} impossible : HTTP ${res.status}`);
  return res;
}

function pad(buf: Buffer, fill: number): Buffer {
  const rest = buf.length % 4;
  return rest === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rest, fill)]);
}

const gltf = (await (await download("Suzanne.gltf")).json()) as Record<string, any>;
const bin = Buffer.from(await (await download("Suzanne.bin")).arrayBuffer());

delete gltf.images;
delete gltf.textures;
delete gltf.samplers;
gltf.materials = (gltf.materials ?? []).map((m: Record<string, unknown>) => ({
  name: m.name,
  pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.5 },
}));
// Les coordonnées de texture restent dans le buffer : inutilisées mais inoffensives.
gltf.buffers = [{ byteLength: bin.length }];
gltf.asset = { ...gltf.asset, generator: "spike shared/assets/build-model.ts" };

const json = pad(Buffer.from(JSON.stringify(gltf), "utf8"), 0x20);
const data = pad(bin, 0x00);

const header = Buffer.alloc(12);
const total = 12 + 8 + json.length + 8 + data.length;
header.write("glTF", 0, "ascii");
header.writeUInt32LE(2, 4);
header.writeUInt32LE(total, 8);

const chunk = (body: Buffer, type: string): Buffer => {
  const head = Buffer.alloc(8);
  head.writeUInt32LE(body.length, 0);
  head.write(type, 4, "ascii");
  return Buffer.concat([head, body]);
};

const glb = Buffer.concat([header, chunk(json, "JSON"), chunk(data, "BIN\0")]);
if (glb.length > MAX_BYTES) throw new Error(`model.glb pèse ${glb.length} octets, au-delà de 1 Mo`);

writeFileSync(OUT, glb);
console.log(`model.glb écrit : ${(glb.length / 1024).toFixed(1)} Ko`);
