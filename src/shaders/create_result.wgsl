const INDEX_BITS = 5u;
const SIDE_LENGTH = 33u;
const TOTAL_SIZE = 35937u;

struct Box {
    r0: u32,
    r1: u32,
    g0: u32,
    g1: u32,
    b0: u32,
    b1: u32
}

struct Moments {
    r: array<u32, TOTAL_SIZE>,
    g: array<u32, TOTAL_SIZE>,
    b: array<u32, TOTAL_SIZE>,
    w: array<u32, TOTAL_SIZE>,
    quad: array<u32, TOTAL_SIZE>
}

@group(0) @binding(0) var<storage> moments: Moments;

@group(1) @binding(0) var<storage> cubes: array<Box>;
@group(1) @binding(1) var<uniform> total_cubes_num: u32;

@group(2) @binding(0) var<storage, read_write> results: array<u32>;

fn get_index(r: u32, g: u32, b: u32) -> u32 {
    return (r << (2 * INDEX_BITS)) + (r << (INDEX_BITS + 1)) + r + (g << INDEX_BITS) + g + b;
}

fn volume(cube: Box, moment: ptr<storage, array<u32, TOTAL_SIZE>>) -> u32 {
    return (
        (*moment)[get_index(cube.r1, cube.g1, cube.b1)] -
        (*moment)[get_index(cube.r1, cube.g1, cube.b0)] -
        (*moment)[get_index(cube.r1, cube.g0, cube.b1)] +
        (*moment)[get_index(cube.r1, cube.g0, cube.b0)] -
        (*moment)[get_index(cube.r0, cube.g1, cube.b1)] +
        (*moment)[get_index(cube.r0, cube.g1, cube.b0)] +
        (*moment)[get_index(cube.r0, cube.g0, cube.b1)] -
        (*moment)[get_index(cube.r0, cube.g0, cube.b0)]
    );
}

@compute @workgroup_size(3, 32)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let channel = id.x;
    let cube_idx = id.y;

    if (cube_idx > total_cubes_num) {
        return;
    }

    let cube = cubes[cube_idx];
    let weight = volume(cube, &moments.w);

    if (weight > 0) {
        if (channel == 0) {
            let r = round(f32(volume(cube, &moments.r)) / f32(weight));
            results[cube_idx * 3 + 0] = u32(r);
        } else if (channel == 1) {
            let g = round(f32(volume(cube, &moments.g)) / f32(weight));
            results[cube_idx * 3 + 1] = u32(g);
        } else {
            let b = round(f32(volume(cube, &moments.b)) / f32(weight));
            results[cube_idx * 3 + 2] = u32(b);
        }
    }
}

