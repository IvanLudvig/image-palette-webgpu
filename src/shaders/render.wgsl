struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2f,
};

@vertex fn vs(
    @builtin(vertex_index) vertexIndex : u32
) -> OurVertexShaderOutput {
    let pos = array(
        vec2f(0.0, 0.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0)
    );

    var vsOutput: OurVertexShaderOutput;
    let xy = pos[vertexIndex];
    vsOutput.position = vec4f(2.0*xy - 1.0, 0.0, 1.0);
    vsOutput.texcoord = xy;
    return vsOutput;
}

@group(0) @binding(0) var ourTexture: texture_2d<f32>;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var<storage> centroids: array<f32>;
@group(0) @binding(3) var<storage> clusters: array<u32>;

@fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    var color = textureSample(ourTexture, ourSampler, fsInput.texcoord);
    return color;
}
