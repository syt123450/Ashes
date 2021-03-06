import { Texture, Sampler } from "./texture";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { Mesh } from "./mesh/mesh";
import { QuadMesh } from "./mesh/quadMesh";
import { Shader } from "./shader";
import { Screen } from "./webgl2/screen";

// Post effect
export class Filter {
    static sampleColor: Sampler = {
        magFilter: WebGL2RenderingContext.LINEAR,
        minFilter: WebGL2RenderingContext.LINEAR,
        wrapS: WebGL2RenderingContext.CLAMP_TO_EDGE,
        wrapT: WebGL2RenderingContext.CLAMP_TO_EDGE,
    };
    static sampleDepth: Sampler = {
        magFilter: WebGL2RenderingContext.NEAREST,
        minFilter: WebGL2RenderingContext.NEAREST,
        wrapS: WebGL2RenderingContext.CLAMP_TO_EDGE,
        wrapT: WebGL2RenderingContext.CLAMP_TO_EDGE,
    };
    ctx: WebGL2RenderingContext;
    width: number;
    height: number;
    buffer: WebGLFramebuffer;
    color: Texture[] = [];
    input: Texture;
    output: Texture;
    depth: Texture[] = [];
    meshRender: MeshRenderer;
    material: Material;
    mesh: Mesh;
    renderToScreen = true;
    screen: Screen;
    constructor(screen: Screen, shader: Shader, width: number = screen.pow2width, height: number = screen.pow2height) {
        this.ctx = screen.gl;
        this.screen = screen;
        this.width = width;
        this.height = height;

        // Create framebuffer
        this.buffer = this.ctx.createFramebuffer();

        this.output = this.attachTexture();

        this.mesh = new QuadMesh();
        this.material = new Material(shader);
        this.meshRender = new MeshRenderer(screen, this.mesh, this.material);
    }

    clone(screen: Screen = this.screen) {
        return new Filter(screen, Shader.clone(this.material.shader), this.width, this.height);
    }
    setInput(tex: Texture, channel = 'base') {
        this.input = tex;
        Material.setTexture(this.material, channel, tex);
        this.material.isDirty = true;
    }

    private static COLOR_ATTACH_BASE = WebGL2RenderingContext.COLOR_ATTACHMENT0;
    private static DEPTH_ATTACHMENT = WebGL2RenderingContext.DEPTH_ATTACHMENT;
    private static FRAMEBUFFER = WebGL2RenderingContext.FRAMEBUFFER;

    bind(target = this.buffer) {
        this.ctx.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, target);
    }

    attachTexture() {
        this.bind();

        let color = new Texture(null, Filter.sampleColor, this.width, this.height);
        Texture.createTexture(this.ctx, color);
        this.ctx.framebufferTexture2D(Filter.FRAMEBUFFER, Filter.COLOR_ATTACH_BASE + this.color.length, color.glType, color.texture, color.level);
        this.color.push(color);

        let depth = new Texture(null, Filter.sampleDepth, this.width, this.height);
        depth.internalformat = WebGL2RenderingContext.DEPTH_COMPONENT24;
        depth.format = WebGL2RenderingContext.DEPTH_COMPONENT;
        depth.type = WebGL2RenderingContext.UNSIGNED_INT;
        Texture.createTexture(this.ctx, depth);
        this.ctx.framebufferTexture2D(Filter.FRAMEBUFFER, Filter.DEPTH_ATTACHMENT, depth.glType, depth.texture, depth.level);
        this.depth.push(depth);

        this.bind(null);

        return color;
    }
}