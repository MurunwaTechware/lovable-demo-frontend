import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type * as THREE from "three"; // types only: three itself is loaded when the viewer mounts

// A base body mesh (GLB) the user can turn by dragging; it turns slowly on its own until they do.
// three.js is loaded only when this is on screen, so other pages don't download it. If WebGL isn't
// available, the mesh's picture is shown instead.

export function BodyMesh({
  model,
  image,
  className = "relative h-96",
}: {
  model: string;
  image: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};
    setState("loading");

    (async () => {
      try {
        const T = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        if (disposed) return;

        const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.domElement.style.touchAction = "pan-y"; // vertical swipes still scroll the page
        el.appendChild(renderer.domElement);

        const scene = new T.Scene();
        scene.add(new T.HemisphereLight(0xffffff, 0x8a7f78, 1.6));
        const key = new T.DirectionalLight(0xffffff, 2.2);
        key.position.set(1.5, 2.5, 3);
        scene.add(key);
        const rim = new T.DirectionalLight(0xffffff, 0.8);
        rim.position.set(-2, 1.5, -2);
        scene.add(rim);

        const gltf = await new GLTFLoader().loadAsync(model);
        if (disposed) {
          renderer.dispose();
          return;
        }
        const body = gltf.scene;
        const material = new T.MeshStandardMaterial({ color: 0xd9cdc3, roughness: 0.65 });
        body.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material;
        });
        scene.add(body);

        // Frame the whole body (the meshes stand on the ground, facing the camera)
        const box = new T.Box3().setFromObject(body);
        const size = box.getSize(new T.Vector3());
        const centre = box.getCenter(new T.Vector3());
        const camera = new T.PerspectiveCamera(28, 1, 0.1, 50);
        const distance = (size.y * 0.62) / Math.tan(T.MathUtils.degToRad(14));
        camera.position.set(centre.x, centre.y + 0.05, centre.z + distance);
        camera.lookAt(centre);

        const resize = () => {
          const w = el.clientWidth || 1;
          const h = el.clientHeight || 1;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(el);

        // Drag to turn; it keeps turning slowly until the first drag
        let yaw = -0.35;
        let spinning = true;
        let dragX: number | null = null;
        const down = (e: PointerEvent) => {
          dragX = e.clientX;
          spinning = false;
        };
        const move = (e: PointerEvent) => {
          if (dragX === null) return;
          yaw += (e.clientX - dragX) * 0.01;
          dragX = e.clientX;
        };
        const up = () => (dragX = null);
        renderer.domElement.addEventListener("pointerdown", down);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);

        let frame = 0;
        const loop = () => {
          if (spinning) yaw += 0.004;
          body.rotation.y = yaw;
          renderer.render(scene, camera);
          frame = requestAnimationFrame(loop);
        };
        loop();
        setState("ready");

        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          renderer.domElement.removeEventListener("pointerdown", down);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          body.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
          material.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!disposed) setState("fallback");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [model]);

  return (
    // className must position the box (relative or absolute) and give it a height
    <div className={className}>
      <div
        ref={host}
        className={`absolute inset-0 cursor-grab active:cursor-grabbing ${state === "fallback" ? "hidden" : ""}`}
        aria-label="Your base body. Drag to turn it."
        role="img"
      />
      {state === "fallback" && (
        <img
          src={image}
          alt="Your base body"
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      {state === "loading" && (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
}
