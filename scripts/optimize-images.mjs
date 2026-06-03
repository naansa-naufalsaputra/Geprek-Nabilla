import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const outDir = path.join(assetsDir, 'optimized');

const IMAGE_MAP = [
    { input: 'hero-dish.webp', widths: [640, 960, 1280], quality: 74 },
    { input: 'ayam-geprek.webp', widths: [320, 480, 640], quality: 76 },
    { input: 'ayam-karamel.webp', widths: [320, 480, 640], quality: 76 },
    { input: 'babat_gongso.webp', widths: [320, 480, 640], quality: 76 },
    { input: 'es_jeruk.webp', widths: [280, 420, 560], quality: 78 },
    { input: 'es_teh.webp', widths: [280, 420, 560], quality: 78 },
    { input: 'es_teh_lemon.webp', widths: [280, 420, 560], quality: 78 }
];

const ensureDir = async () => {
    await mkdir(outDir, { recursive: true });
};

const buildVariantName = (input, width) => {
    const base = input.replace(/\.webp$/i, '');
    return `${base}-${width}.webp`;
};

const optimizeSingleImage = async ({ input, widths, quality }) => {
    const inputPath = path.join(assetsDir, input);

    for (const width of widths) {
        const outputName = buildVariantName(input, width);
        const outputPath = path.join(outDir, outputName);
        await sharp(inputPath)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality })
            .toFile(outputPath);
    }
};

const run = async () => {
    await ensureDir();
    for (const spec of IMAGE_MAP) {
        await optimizeSingleImage(spec);
    }
    console.log('Image optimization complete. Output:', outDir);
};

run().catch((error) => {
    console.error('Image optimization failed:', error);
    process.exitCode = 1;
});
