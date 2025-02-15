/**
 * Converts a float array to a hex color string.
 * @param {Float32Array} floatArray - The float array to convert.
 * @returns {string} The hex color string.
 */
export function floatArrayToHex(colors) {
    const hexColors = [];
    for (let i = 0; i < colors.length; i += 3) {
        const r = Math.round(colors[i] * 255).toString(16).padStart(2, '0');
        const g = Math.round(colors[i + 1] * 255).toString(16).padStart(2, '0');
        const b = Math.round(colors[i + 2] * 255).toString(16).padStart(2, '0');
        hexColors.push(`#${r}${g}${b}`);
    }
    return hexColors;
}
