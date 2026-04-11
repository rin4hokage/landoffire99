import { useCallback, useEffect, useRef } from "react";

/**
 * Throttle a callback so it fires at most once every `delay` ms.
 * Used for the mousemove handler to keep WebGL uniform updates near 60fps
 * even on machines that fire rapid pointer events.
 */
const useThrottledCallback = <T extends (...args: never[]) => void>(callback: T, delay: number) => {
  const timeoutRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current === null) {
        callbackRef.current(...args);
        timeoutRef.current = window.setTimeout(() => {
          timeoutRef.current = null;
        }, delay);
      }
    },
    [delay],
  );
};

type ShaderParams = {
  hue?: number;
  speed?: number;
  intensity?: number;
  complexity?: number;
  /** Multiplied into the alpha channel — keeps the effect subtle. 0..1 */
  opacity?: number;
};

/**
 * Interactive WebGL shader background.
 *
 * Renders a slow-moving FBM noise field tinted to the brand's red, which
 * warps + brightens around the mouse cursor. Dark areas are output with
 * alpha=0 so the page's pure-black background reads through, and the
 * effect only "lights up" where the noise peaks. The result is a subtle
 * interactive ambient layer that animates without overwhelming content.
 *
 * Sized to fill the entire viewport via position: fixed; pointer-events
 * are disabled so it never blocks clicks.
 *
 * Adapted from a generic shader playground component — control sliders
 * stripped, parameters tuned for VOID's red palette and the
 * "subtle ambient atmosphere" use case.
 */
export const InteractiveShaderBackground = ({
  hue = 0,
  speed = 0.22,
  intensity = 1.4,
  complexity = 5,
  opacity = 0.55,
  className,
}: ShaderParams & { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const throttledMouseMove = useThrottledCallback((event: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePos.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePos.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }, 16);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      console.warn("InteractiveShaderBackground: WebGL not supported, skipping render.");
      return;
    }

    // ----- Shaders -----
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;

    // FBM noise tinted to a hue, with mouse warp + glow.
    // Brightness has a baseline subtracted so dark areas become transparent;
    // alpha mirrors brightness so the page bg reads through naturally.
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_hue;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_complexity;
      uniform float u_opacity;

      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
      }

      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 10; i++) {
          if (float(i) >= u_complexity) break;
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float t = u_time * u_speed * 0.1;

        float mouse_dist = distance(uv, u_mouse);
        // Mouse warp distorts the noise field within ~0.6 units of the cursor
        float warp = smoothstep(0.5, 0.0, mouse_dist) * 0.55;

        vec2 p = uv * 1.6 + vec2(t, t * 0.5) + warp;
        float noise_pattern = fbm(p);

        float vignette = 1.0 - smoothstep(0.7, 1.6, length(uv));
        // Subtle baseline subtraction so most of the screen is transparent
        float brightness = noise_pattern * u_intensity * vignette;
        brightness = max(0.0, brightness - 0.42);

        // Add a soft glow that follows the cursor so the effect feels
        // interactive even in otherwise quiet noise areas
        float mouseGlow = smoothstep(0.55, 0.0, mouse_dist) * 0.42;
        brightness += mouseGlow;

        vec3 color = hsv2rgb(vec3(u_hue / 360.0, 0.86, 1.0));

        // Alpha follows brightness so dark fragments are fully transparent
        float alpha = clamp(brightness, 0.0, 1.0) * u_opacity;
        gl_FragColor = vec4(color * brightness, alpha);
      }
    `;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Enable alpha blending so transparent fragments composite over the page bg
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const hueLocation = gl.getUniformLocation(program, "u_hue");
    const speedLocation = gl.getUniformLocation(program, "u_speed");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");
    const complexityLocation = gl.getUniformLocation(program, "u_complexity");
    const opacityLocation = gl.getUniformLocation(program, "u_opacity");

    let animationFrameId = 0;
    const startTime = performance.now();
    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (performance.now() - startTime) * 0.001);
      gl.uniform2f(mouseLocation, mousePos.current.x, mousePos.current.y);
      gl.uniform1f(hueLocation, hue);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(complexityLocation, complexity);
      gl.uniform1f(opacityLocation, opacity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    window.addEventListener("mousemove", throttledMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", throttledMouseMove);
      if (gl && !gl.isContextLost()) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [hue, speed, intensity, complexity, opacity, throttledMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
};
