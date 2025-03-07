struct Counts {
    centroids: u32
};

const INDEX_BITS = 5u;
const MAX_VALUE = (1u << INDEX_BITS) - 1u;
const MAX_VALUE_F32 = f32(MAX_VALUE);
const COLOR_COUNT = 1u << (INDEX_BITS * 3u);

@group(0) @binding(0) var<storage, read> histogram: array<u32>;
@group(0) @binding(1) var<uniform> counts: Counts;
@group(1) @binding(0) var<storage, read> centroids: array<f32>;
@group(1) @binding(1) var<storage, read_write> clusters: array<u32>;

fn dist(a: vec3f, b: vec3f) -> f32 {
    return pow((a.x - b.x), 2) + pow((a.y - b.y), 2) + pow((a.z - b.z), 2);
}

fn get_rgb(index: u32) -> vec3f {
    let r = (index >> (2 * INDEX_BITS)) & MAX_VALUE;
    let g = (index >> INDEX_BITS) & MAX_VALUE;
    let b = index & MAX_VALUE;

    return vec3f(f32(r) / MAX_VALUE_F32, f32(g) / MAX_VALUE_F32, f32(b) / MAX_VALUE_F32);
}

@compute @workgroup_size(256)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    if (id.x >= COLOR_COUNT) {
        return;
    }

    let count = histogram[id.x];
    if (count == 0) {
        return;
    }

    let pos = get_rgb(id.x);

    var min_dist = -1.;
    var closest = 0u;
    
    for (var i = 0u; i < counts.centroids; i++) {
        let centroid = vec3f(centroids[3*i], centroids[3*i + 1], centroids[3*i + 2]);
        if (centroid.x == -1.0 || centroid.y == -1.0 || centroid.z == -1.0) {
            continue;
        }
        let d = dist(pos, centroid);
        if (min_dist == -1 || d < min_dist){
            closest = i;
            min_dist = d;
        }
    }

    clusters[id.x] = closest;
}
