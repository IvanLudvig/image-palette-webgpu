struct KeyValue {
    key: atomic<u32>,
    value: atomic<u32>
};

const INDEX_BITS = 8u;
const HASH_TABLE_SIZE = 1u << 16u;
const MAX_PROBES = 256u;
const EMPTY = 0u;

@group(0) @binding(0) var tex: texture_2d<f32>;
@group(1) @binding(0) var<storage, read_write> histogram: array<KeyValue, HASH_TABLE_SIZE>;

fn hash(key: u32) -> u32 {
    var h = key;
    h ^= h >> 16u;
    h *= 0x85ebca6bu;
    h ^= h >> 13u;
    h *= 0xc2b2ae35u;
    h ^= h >> 16u;
    return h & (HASH_TABLE_SIZE - 1);
}

fn get_index(r: u32, g: u32, b: u32) -> u32 {
    return (r << (2 * INDEX_BITS)) + (g << INDEX_BITS) + b + 1u;
}

fn insert(key: u32, value: u32) {
    var slot = hash(key);
    var i = 0u;
    loop {
        let prev = atomicCompareExchangeWeak(&histogram[slot].key, EMPTY, key);
        if (prev.exchanged || prev.old_value == key) {
            atomicAdd(&histogram[slot].value, value);
            break;
        }

        i += 1u;
        if (i >= MAX_PROBES) {
            break;
        }

        slot = (slot + 1u) & (HASH_TABLE_SIZE - 1);
    }
}

@compute @workgroup_size(16, 16)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let dimensions = textureDimensions(tex);
    let width = u32(dimensions.x);
    let height = u32(dimensions.y);

    let pointId = id.x + id.y * width;

    if (pointId >= width * height) {
        return;
    }
    
    let pixel = textureLoad(tex, id.xy, 0);

    let r = u32(pixel.r * 255.0);
    let g = u32(pixel.g * 255.0);
    let b = u32(pixel.b * 255.0);

    let bits_to_remove = 8u - INDEX_BITS;
    let ir = r >> bits_to_remove;
    let ig = g >> bits_to_remove;
    let ib = b >> bits_to_remove;
    let index = get_index(ir, ig, ib);
    
    insert(index, 1u);
}
