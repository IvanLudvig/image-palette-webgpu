/**
 * Extracts dominant colors from an image source using WebGPU API with various algorithms.
 *
 * @param {ImageBitmapSource} imageSource - The image source to process.
 * @param {number} colorCount - The number of dominant colors to extract.
 * @param {string} algorithm - The algorithm to use for color extraction. Possible values are:
 *   - `wu`: Uses the Wu algorithm.
 *   - `kmeans`: Uses the K-means algorithm.
 *   - `celebi`: Uses the Celebi algorithm.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of dominant colors.
 * @throws {Error} Throws an error if an unknown algorithm is specified.
 */
export async function extractDominantColors(imageSource, colorCount, algorithm) {
    let extractFunction;

    switch (algorithm) {
        case 'wu':
            extractFunction = (await import('./wu/index.js')).extractDominantColorsWu;
            break;
        case 'kmeans':
            extractFunction = (await import('./kmeans/index.js')).extractDominantColorsKMeans;
            break;
        case 'celebi':
            extractFunction = (await import('./celebi/index.js')).extractDominantColorsCelebi;
            break;
        default:
            throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    return extractFunction(imageSource, colorCount);
}
