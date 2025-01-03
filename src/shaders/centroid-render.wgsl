struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
};

@group(0) @binding(2) var<storage> centroids: array<f32>;

@vertex
fn vs(
    @builtin(vertex_index) vertex_idx: u32,
    @builtin(instance_index) instance: u32,
) -> VertexOutput {
    let pos = array(
        vec2f(0.0, 0.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0),
    );
    let xy = pos[vertex_idx];

    let size = 0.1;
    
    let position = vec2f(
        -1.0 + size * (f32(instance)) + xy.x * size,
        -1.0 + xy.y * size
    );
    
    var output: VertexOutput;
    output.position = vec4f(position, 0.0, 1.0);
    output.color = vec3f(
        centroids[3 * instance],
        centroids[3 * instance + 1],
        centroids[3 * instance + 2]
    );
    return output;
}

@fragment
fn fs(@location(0) color: vec3f) -> @location(0) vec4f {
    return vec4f(color, 1.0);
} 