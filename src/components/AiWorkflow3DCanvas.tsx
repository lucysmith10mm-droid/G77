import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Sparkles,
  User,
  Brain,
  Clapperboard,
  Gem,
  Play,
  RefreshCw,
  Layers,
  RotateCcw,
  Zap,
} from 'lucide-react';

export type CreativeShapeId = 'diamond' | 'dancer' | 'brain' | 'clapperboard';

interface ShapeMeta {
  id: CreativeShapeId;
  name: string;
  subtitle: string;
  category: string;
  accentGradient: string;
  accentGlow: string;
  iconColor: string;
}

const SHAPES: ShapeMeta[] = [
  {
    id: 'diamond',
    name: '3D Brilliant Diamond',
    subtitle: 'Faceted gemstone core enclosed within an 8-blade mechanical camera aperture',
    category: 'FACETED GEM',
    accentGradient: 'from-teal-400 via-cyan-400 to-fuchsia-500',
    accentGlow: 'rgba(45, 212, 191, 0.4)',
    iconColor: 'text-teal-300',
  },
  {
    id: 'dancer',
    name: 'Seedance Ballerina',
    subtitle: 'Humanoid dancer in classic Arabesque pointe pose with kinetic energy ribbons',
    category: 'KINETIC MOTION',
    accentGradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
    accentGlow: 'rgba(217, 70, 239, 0.4)',
    iconColor: 'text-fuchsia-400',
  },
  {
    id: 'brain',
    name: 'Neural AI Cortex',
    subtitle: 'Dual-hemisphere brain with deep sulci folds, brainstem & firing synaptic sparks',
    category: 'DEEP LEARNING',
    accentGradient: 'from-cyan-400 via-sky-500 to-indigo-600',
    accentGlow: 'rgba(56, 189, 248, 0.4)',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'clapperboard',
    name: 'Hollywood Clapperboard',
    subtitle: 'Classic director slate with angled zebra clapstick & swirling 3D film strip',
    category: 'PRODUCTION SLATE',
    accentGradient: 'from-amber-400 via-emerald-500 to-cyan-500',
    accentGlow: 'rgba(251, 191, 36, 0.4)',
    iconColor: 'text-amber-300',
  },
];

export const AiWorkflow3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeShape, setActiveShape] = useState<CreativeShapeId>('diamond');
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [morphCountdown, setMorphCountdown] = useState<number>(100);

  const activeShapeRef = useRef<CreativeShapeId>('diamond');
  const isAutoPlayRef = useRef<boolean>(true);
  const resetCameraRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    activeShapeRef.current = activeShape;
  }, [activeShape]);

  useEffect(() => {
    isAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay]);

  // Smooth Auto-Morph Cycle Timer (every 8 seconds)
  useEffect(() => {
    if (!isAutoPlay) {
      setMorphCountdown(100);
      return;
    }

    const intervalMs = 100;
    const totalTimeMs = 8000;
    const decrement = (intervalMs / totalTimeMs) * 100;

    const timer = setInterval(() => {
      setMorphCountdown((prev) => {
        if (prev <= decrement) {
          // Switch to next shape
          setActiveShape((current) => {
            const idx = SHAPES.findIndex((s) => s.id === current);
            const nextIdx = (idx + 1) % SHAPES.length;
            return SHAPES[nextIdx].id;
          });
          return 100;
        }
        return prev - decrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoPlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 520;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000);
    const defaultCamZ = 32;
    camera.position.set(0, 0, defaultCamZ);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Crisp High-Definition Micro-Particle Canvas Texture
    const createMicroParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.32, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.62, 'rgba(240, 245, 255, 0.5)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createMicroParticleTexture();

    // 4. 18,000 Micro-Particles for Ultra-Dense Holographic Surfaces
    const PARTICLE_COUNT = 18000;
    const geometry = new THREE.BufferGeometry();
    const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const targetColors = new Float32Array(PARTICLE_COUNT * 3);
    const currentColors = new Float32Array(PARTICLE_COUNT * 3);

    // -------------------------------------------------------------
    // HIGH-DEFINITION 3D PARAMETRIC SHAPE GENERATORS
    // -------------------------------------------------------------
    const computeShapeCoordinates = (shape: CreativeShapeId) => {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        const p = i / PARTICLE_COUNT;

        let x = 0;
        let y = 0;
        let z = 0;
        let r = 1.0;
        let g = 1.0;
        let b = 1.0;

        if (shape === 'diamond') {
          // =========================================================
          // 1. 3D FACETED BRILLIANT DIAMOND & APERTURE IRIS (FIRST PLACE)
          // =========================================================
          if (p < 0.65) {
            // Classic Brilliant-Cut 3D Diamond
            const diamondT = p / 0.65;
            const angle = Math.random() * Math.PI * 2;

            if (diamondT < 0.20) {
              // Top Table Facet
              const rad = Math.sqrt(Math.random()) * 4.0;
              x = Math.cos(angle) * rad;
              y = 4.2;
              z = Math.sin(angle) * rad;
              r = 1.0; g = 1.0; b = 1.0; // Pure crystalline white
            } else if (diamondT < 0.50) {
              // Crown Facets
              const tCrown = (diamondT - 0.20) / 0.30;
              const rad = 4.0 + tCrown * 3.5;
              const crownY = 4.2 - tCrown * 2.2;
              x = Math.cos(angle) * rad;
              y = crownY;
              z = Math.sin(angle) * rad;
              r = 0.3 + tCrown * 0.5;
              g = 0.85;
              b = 1.0; // Prismatic Cyan/Sky
            } else {
              // Pavilion Facets
              const tPavilion = (diamondT - 0.50) / 0.50;
              const rad = 7.5 * (1.0 - tPavilion);
              const pavY = 2.0 - tPavilion * 8.5;
              x = Math.cos(angle) * rad;
              y = pavY;
              z = Math.sin(angle) * rad;

              r = 0.4 + tPavilion * 0.5;
              g = 0.5;
              b = 1.0; // Deep Diamond Blue/Violet
            }
          } else {
            // 8-Blade Mechanical Camera Iris Ring
            const bladeT = (p - 0.65) / 0.35;
            const bladeIdx = Math.floor(bladeT * 8);
            const bladeFrac = (bladeT * 8) % 1;
            const bladeBaseAngle = (bladeIdx / 8) * Math.PI * 2;

            const irisR = 8.6 + bladeFrac * 3.5;
            const irisAngle = bladeBaseAngle + (bladeFrac * 0.65);

            x = Math.cos(irisAngle) * irisR + (Math.random() - 0.5) * 0.2;
            y = (Math.random() - 0.5) * 0.4;
            z = Math.sin(irisAngle) * irisR + (Math.random() - 0.5) * 0.2;

            r = 0.2; g = 0.95; b = 0.75; // Emerald Aperture Blades
          }
        } else if (shape === 'dancer') {
          // =========================================================
          // 2. SEEDANCE BALLERINA IN ARABESQUE POINTE POSE
          // =========================================================
          if (p < 0.08) {
            // Head with Classical Ballet Hair Bun
            const isBun = i % 3 === 0;
            if (isBun) {
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.acos(2 * Math.random() - 1);
              const bunR = 0.7;
              x = bunR * Math.sin(phi) * Math.cos(theta);
              y = 9.8 + bunR * Math.cos(phi);
              z = -0.5 + bunR * Math.sin(phi) * Math.sin(theta);
            } else {
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.acos(2 * Math.random() - 1);
              const headR = 1.25;
              x = headR * Math.sin(phi) * Math.cos(theta);
              y = 8.3 + headR * Math.cos(phi);
              z = headR * Math.sin(phi) * Math.sin(theta);
            }
            r = 1.0; g = 0.95; b = 1.0; // Glowing White Core
          } else if (p < 0.28) {
            // Slender Arched Torso & Waist
            const t = (p - 0.08) / 0.20;
            const spineY = 1.2 + t * 6.0;
            const arch = Math.sin(t * Math.PI) * 0.9;
            const torsoAngle = Math.random() * Math.PI * 2;

            let widthR = 0.7;
            if (t > 0.7) widthR = 1.6 * (t - 0.7) / 0.3;
            else if (t < 0.25) widthR = 1.4 * (0.25 - t) / 0.25;
            else widthR = 0.65;

            const rad = widthR * Math.sqrt(Math.random());
            x = Math.cos(torsoAngle) * rad;
            y = spineY;
            z = Math.sin(torsoAngle) * rad + arch;

            r = 0.95; g = 0.3; b = 0.75; // Radiant Rose Body
          } else if (p < 0.50) {
            // Classical Ballet Arms (Left High Overhead, Right Outward Arabesque)
            const isLeft = i % 2 === 0;
            const t = ((i % 1980) / 1980);

            if (isLeft) {
              const armAngle = t * Math.PI * 0.85;
              x = -1.2 - Math.sin(armAngle) * 4.4;
              y = 6.8 + Math.cos(armAngle) * 4.4;
              z = Math.sin(t * Math.PI) * 1.2;
            } else {
              x = 1.4 + t * 6.6;
              y = 6.4 - t * 2.8;
              z = -t * 2.2;
            }

            x += (Math.random() - 0.5) * 0.2;
            y += (Math.random() - 0.5) * 0.2;
            z += (Math.random() - 0.5) * 0.2;

            r = 0.35; g = 0.85; b = 1.0; // Cyan Energy Stream
          } else if (p < 0.74) {
            // Legs: Standing On Pointe & Rear Arabesque Lift
            const isStanding = i % 2 === 0;
            const t = ((i % 2160) / 2160);

            if (isStanding) {
              x = -0.3 + (Math.random() - 0.5) * 0.3;
              y = 1.2 - t * 8.6;
              z = (Math.random() - 0.5) * 0.3;
            } else {
              x = 0.4 + (Math.random() - 0.5) * 0.25;
              y = 1.0 - Math.sin(t * Math.PI * 0.45) * 3.6;
              z = -t * 8.8;
            }

            r = 0.75; g = 0.4; b = 0.95; // Deep Violet
          } else {
            // Flared Tutu Skirt & Ambient Swirling Ribbons
            const isTutu = (p - 0.74) < 0.16;
            if (isTutu) {
              const tutuAngle = Math.random() * Math.PI * 2;
              const tutuR = 1.2 + Math.pow(Math.random(), 0.5) * 4.9;
              x = Math.cos(tutuAngle) * tutuR;
              y = 1.4 - (tutuR / 4.9) * 0.6 + (Math.random() - 0.5) * 0.25;
              z = Math.sin(tutuAngle) * tutuR;
              r = 1.0; g = 0.45; b = 0.85; // Fuchsia Tutu
            } else {
              const ribT = (p - 0.90) / 0.10;
              const ribAngle = ribT * Math.PI * 8;
              const ribR = 3.5 + ribT * 4.6;
              x = Math.cos(ribAngle) * ribR;
              y = -7.6 + ribT * 4.2;
              z = Math.sin(ribAngle) * ribR;
              r = 0.25; g = 0.95; b = 0.9; // Teal Floor Swirl
            }
          }
        } else if (shape === 'brain') {
          // =========================================================
          // 3. ANATOMICAL NEURAL AI BRAIN (SULCI FOLDS & SYNAPSES)
          // =========================================================
          if (p < 0.82) {
            // Left & Right Cortex Hemispheres with distinct fissure
            const isLeft = i % 2 === 0;
            const side = isLeft ? -1 : 1;

            const u = Math.random();
            const v = Math.random();
            const theta = u * Math.PI * 2;
            const phi = Math.acos(2 * v - 1);

            const dimA = 6.2;
            const dimB = 5.4;
            const dimC = 7.6;

            const gyriPattern = (
              Math.sin(theta * 7) * 0.55 +
              Math.cos(phi * 9) * 0.45 +
              Math.sin((theta + phi) * 6) * 0.35
            );

            const scale = 1.0 + gyriPattern * 0.18;
            const rawX = dimA * Math.sin(phi) * Math.cos(theta) * scale;
            const rawY = dimB * Math.cos(phi) * scale;
            const rawZ = dimC * Math.sin(phi) * Math.sin(theta) * scale;

            x = (rawX * 0.52) + (side * 3.4);
            y = rawY;
            z = rawZ;

            const foldIntensity = Math.max(0, gyriPattern);
            r = 0.15 + foldIntensity * 0.45;
            g = 0.65 + foldIntensity * 0.35;
            b = 1.0;
          } else if (p < 0.92) {
            // Cerebellum & Brainstem
            const t = (p - 0.82) / 0.10;
            const stemAngle = Math.random() * Math.PI * 2;
            const stemR = 0.8 + Math.random() * 0.6;
            x = Math.cos(stemAngle) * stemR;
            y = -4.5 - t * 4.6;
            z = -2.5 + (Math.random() - 0.5) * 0.8;

            r = 0.85; g = 0.45; b = 0.95;
          } else {
            // Internal Synaptic Spark Lattice
            const coreAngle = Math.random() * Math.PI * 2;
            const coreR = Math.random() * 3.2;

            x = Math.cos(coreAngle) * coreR;
            y = (Math.random() - 0.5) * 4.5;
            z = (Math.random() - 0.5) * 5.0;

            r = 1.0; g = 0.95; b = 0.4;
          }
        } else {
          // =========================================================
          // 4. HOLLYWOOD CINEMA CLAPPERBOARD & 3D FILMSTRIP
          // =========================================================
          if (p < 0.45) {
            // Main Slate Board with crisp lines
            const u = (Math.random() - 0.5) * 11.2;
            const v = (Math.random() - 0.5) * 6.6;

            x = u;
            y = v - 1.5;
            z = (Math.random() - 0.5) * 0.45;

            const isBorder = Math.abs(u) > 5.2 || Math.abs(v) > 3.05;
            const isLine = Math.abs(v - 1.0) < 0.08 || Math.abs(v + 0.8) < 0.08;

            if (isBorder || isLine) {
              r = 1.0; g = 1.0; b = 1.0;
            } else {
              r = 0.15; g = 0.35; b = 0.55;
            }
          } else if (p < 0.72) {
            // Top Hinged Clapstick (Tilted 26° with Zebra Stripes)
            const t = (p - 0.45) / 0.27;
            const stickAngle = 0.45;
            const stickLen = 11.6;

            const hingeX = -5.6;
            const hingeY = 2.0;

            const u = t * stickLen;
            const v = (Math.random() - 0.5) * 1.4;

            const rotX = u * Math.cos(stickAngle) - v * Math.sin(stickAngle);
            const rotY = u * Math.sin(stickAngle) + v * Math.cos(stickAngle);

            x = hingeX + rotX;
            y = hingeY + rotY;
            z = (Math.random() - 0.5) * 0.5;

            const stripeVal = Math.sin((u + v) * 3.5);
            if (stripeVal > 0) {
              r = 1.0; g = 0.85; b = 0.15;
            } else {
              r = 0.1; g = 0.15; b = 0.25;
            }
          } else {
            // Swirling 3D Filmstrip wrapping dynamically around the clapper
            const stripT = (p - 0.72) / 0.28;
            const spiralAngle = stripT * Math.PI * 4.5;
            const spiralR = 6.8 + Math.sin(stripT * Math.PI * 2) * 1.5;
            const spiralY = -5.5 + stripT * 12.0;

            const cross = (Math.random() - 0.5) * 2.2;
            x = Math.cos(spiralAngle) * spiralR;
            y = spiralY + cross * 0.3;
            z = Math.sin(spiralAngle) * spiralR + cross * 0.8;

            const isSprocket = Math.abs(cross) > 0.8;
            if (isSprocket) {
              r = 0.2; g = 0.95; b = 0.8;
            } else {
              r = 0.4; g = 0.8; b = 1.0;
            }
          }
        }

        targetPositions[idx] = x;
        targetPositions[idx + 1] = y;
        targetPositions[idx + 2] = z;

        targetColors[idx] = r;
        targetColors[idx + 1] = g;
        targetColors[idx + 2] = b;
      }
    };

    // Initialize with 3D Diamond in 1st Place
    computeShapeCoordinates('diamond');
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      currentPositions[i] = targetPositions[i] + (Math.random() - 0.5) * 10;
      velocities[i] = 0;
      currentColors[i] = targetColors[i];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));

    // Points Material with Ultra-Fine Sizing (size: 0.34 gives sharp holographic clarity)
    const material = new THREE.PointsMaterial({
      size: 0.34,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Outer Holographic Grid Coordinate Ring
    const haloGeo = new THREE.RingGeometry(14.0, 14.2, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // Mouse & Touch Physical Interaction
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouse = new THREE.Vector2(-999, -999);
    const targetMouse = new THREE.Vector2(-999, -999);
    const mouse3D = new THREE.Vector3(0, 0, 0);

    let clickRippleTime = 999;
    const rippleOrigin = new THREE.Vector3(0, 0, 0);

    const updateCoords = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      targetMouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      targetMouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (e: PointerEvent) => updateCoords(e.clientX, e.clientY);
    const handlePointerLeave = () => {
      targetMouse.x = -999;
      targetMouse.y = -999;
    };

    const handlePointerDown = (e: PointerEvent) => {
      updateCoords(e.clientX, e.clientY);
      raycaster.setFromCamera(mouse, camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      if (intersectPoint) {
        rippleOrigin.copy(intersectPoint);
        clickRippleTime = 0;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updateCoords(touch.clientX, touch.clientY);
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectPoint);
        if (intersectPoint) {
          rippleOrigin.copy(intersectPoint);
          clickRippleTime = 0;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    container.addEventListener('pointerdown', handlePointerDown, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Camera Center / Reset Callback
    resetCameraRef.current = () => {
      targetMouse.x = 0;
      targetMouse.y = 0;
      camera.position.set(0, 0, defaultCamZ);
      camera.lookAt(0, 0, 0);
    };

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    let prevShape = activeShapeRef.current;
    let clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Check Shape Transition
      if (prevShape !== activeShapeRef.current) {
        computeShapeCoordinates(activeShapeRef.current);
        prevShape = activeShapeRef.current;
      }

      // Smooth mouse interpolation
      mouse.x += (targetMouse.x - mouse.x) * 0.12;
      mouse.y += (targetMouse.y - mouse.y) * 0.12;

      if (mouse.x > -2 && mouse.x < 2) {
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectPoint);
        if (intersectPoint) {
          mouse3D.copy(intersectPoint);
        }
      }

      // Smooth Parallax Camera Angle
      const targetCamX = mouse.x > -2 ? mouse.x * 4.0 : Math.sin(elapsedTime * 0.2) * 1.5;
      const targetCamY = mouse.x > -2 ? mouse.y * 3.0 : Math.cos(elapsedTime * 0.15) * 1.0;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Controlled, graceful rotation per shape to highlight 3D structure
      const currentShape = activeShapeRef.current;
      if (currentShape === 'diamond') {
        particles.rotation.y = elapsedTime * 0.25;
        particles.rotation.x = 0.15 + Math.sin(elapsedTime * 0.3) * 0.08;
      } else if (currentShape === 'dancer') {
        particles.rotation.y = elapsedTime * 0.22;
        particles.rotation.x = Math.sin(elapsedTime * 0.4) * 0.05;
      } else if (currentShape === 'brain') {
        particles.rotation.y = Math.sin(elapsedTime * 0.3) * 0.35;
        particles.rotation.x = 0.1 + Math.cos(elapsedTime * 0.2) * 0.06;
      } else {
        // clapperboard
        particles.rotation.y = Math.sin(elapsedTime * 0.35) * 0.25;
        particles.rotation.x = 0.08 + Math.cos(elapsedTime * 0.3) * 0.05;
      }

      clickRippleTime += delta * 24;

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const colorArray = colorAttr.array as Float32Array;

      // Elastic Spring Physics Simulation
      const springForce = 3.6;
      const damping = 0.86;
      const interactionRadius = 6.5;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        let px = posArray[idx];
        let py = posArray[idx + 1];
        let pz = posArray[idx + 2];

        const tx = targetPositions[idx];
        const ty = targetPositions[idx + 1];
        const tz = targetPositions[idx + 2];

        let vx = velocities[idx];
        let vy = velocities[idx + 1];
        let vz = velocities[idx + 2];

        // 1. Spring force to target coordinate
        vx += (tx - px) * springForce * delta;
        vy += (ty - py) * springForce * delta;
        vz += (tz - pz) * springForce * delta;

        // 2. Interactive cursor repulsion
        if (mouse.x > -2) {
          const dx = px - mouse3D.x;
          const dy = py - mouse3D.y;
          const dz = pz - mouse3D.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < interactionRadius * interactionRadius && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const force = 1.0 - dist / interactionRadius;
            const push = 20.0 * delta * force;

            vx += (dx / dist) * push;
            vy += (dy / dist) * push;
            vz += (dz / dist) * push;
          }
        }

        // 3. Shockwave ripple on click / tap
        if (clickRippleTime < 22) {
          const rdx = px - rippleOrigin.x;
          const rdy = py - rippleOrigin.y;
          const rdz = pz - rippleOrigin.z;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
          const waveDist = Math.abs(rdist - clickRippleTime);
          if (waveDist < 3.2) {
            const waveForce = (1.0 - waveDist / 3.2) * 18.0 * delta;
            vx += (rdx / (rdist || 1)) * waveForce;
            vy += (rdy / (rdist || 1)) * waveForce;
            vz += (rdz / (rdist || 1)) * waveForce;
          }
        }

        // Damping
        vx *= damping;
        vy *= damping;
        vz *= damping;

        velocities[idx] = vx;
        velocities[idx + 1] = vy;
        velocities[idx + 2] = vz;

        posArray[idx] = px + vx;
        posArray[idx + 1] = py + vy;
        posArray[idx + 2] = pz + vz;

        // Smooth Color Convergence
        colorArray[idx] += (targetColors[idx] - colorArray[idx]) * 0.1;
        colorArray[idx + 1] += (targetColors[idx + 1] - colorArray[idx + 1]) * 0.1;
        colorArray[idx + 2] += (targetColors[idx + 2] - colorArray[idx + 2]) * 0.1;
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);

      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const currentMeta = SHAPES.find((s) => s.id === activeShape) || SHAPES[0];

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl p-[1px] bg-gradient-to-b from-fuchsia-500/40 via-cyan-500/20 to-purple-600/40 shadow-[0_0_60px_rgba(168,85,247,0.22)]">
      
      {/* High-Tech Cyber Frame Container */}
      <div className="relative w-full h-[520px] sm:h-[580px] md:h-[620px] rounded-[calc(1rem-1px)] sm:rounded-[calc(1.5rem-1px)] overflow-hidden bg-[#04030a] flex flex-col items-center justify-between select-none">
        
        {/* Futuristic Cyber Corner Bracket Decals */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none flex items-center gap-1">
          <span className="text-cyan-400 font-mono text-[10px] tracking-widest font-black">⌜</span>
          <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400/80 uppercase hidden sm:inline">
            SYS//HOLO-CORE
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-1">
          <span className="text-[9px] font-mono font-bold tracking-widest text-fuchsia-400/80 uppercase hidden sm:inline">
            FPS: 60 • STABLE
          </span>
          <span className="text-fuchsia-400 font-mono text-[10px] tracking-widest font-black">⌝</span>
        </div>

        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none flex items-center gap-1">
          <span className="text-emerald-400 font-mono text-[10px] tracking-widest font-black">⌞</span>
          <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400/80 uppercase hidden sm:inline">
            DENSITY: 18K
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-1">
          <span className="text-[9px] font-mono font-bold tracking-widest text-amber-400/80 uppercase hidden sm:inline">
            SEEDANCE AI
          </span>
          <span className="text-amber-400 font-mono text-[10px] tracking-widest font-black">⌟</span>
        </div>

        {/* 3D WebGL Canvas Layer (fills full viewport) */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
          style={{ touchAction: 'pan-y' }}
        />

        {/* Ambient Neon Backlights */}
        <div className="absolute top-1/4 left-1/4 w-88 h-88 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-88 h-88 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* ------------------------------------------------------------------ */}
        {/* TOP HUD BAR: Crisp Status, Active Model Telemetry & Quick Toggles  */}
        {/* ------------------------------------------------------------------ */}
        <div className="relative w-full pt-4 sm:pt-5 px-3 sm:px-6 z-10 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Active Hologram Title & Category */}
          <div className="flex flex-col gap-1 max-w-sm sm:max-w-md pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-xl w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
                  {currentMeta.name}
                </span>
              </div>
              <span className="text-[9px] font-mono font-extrabold text-fuchsia-300 bg-fuchsia-500/20 px-2 py-0.5 rounded-full border border-fuchsia-500/40">
                {currentMeta.category}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-300 font-medium px-1 drop-shadow leading-relaxed line-clamp-1">
              {currentMeta.subtitle}
            </p>
          </div>

          {/* Right Action Controls: Auto-Morph, Density & Reset View */}
          <div className="flex items-center gap-2 pointer-events-auto shrink-0 self-end sm:self-auto">
            {/* Reset Camera View Button */}
            <button
              type="button"
              onClick={() => resetCameraRef.current?.()}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-black/70 hover:bg-white/10 backdrop-blur-xl border border-white/15 text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
              title="Reset camera angle to center"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline text-[10px] font-semibold">Center</span>
            </button>

            {/* Auto-Morph Toggle Pill */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`px-3 py-1.5 rounded-full backdrop-blur-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border shadow-lg ${
                isAutoPlay
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-black/70 border-white/20 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={isAutoPlay ? 'Auto-Morph is active. Click to pause.' : 'Auto-Morph is paused. Click to resume.'}
            >
              {isAutoPlay ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  <span className="text-[11px]">Auto: ON</span>
                  {/* Visual countdown bar */}
                  <span className="w-8 h-1.5 bg-black/60 rounded-full overflow-hidden inline-flex border border-emerald-500/30">
                    <span
                      className="h-full bg-emerald-400 rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${morphCountdown}%` }}
                    />
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px]">Auto: OFF</span>
                </>
              )}
            </button>

            {/* 18K Particle Counter Pill */}
            <div className="hidden lg:flex px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-cyan-500/30 text-[11px] font-mono text-cyan-300 items-center gap-1.5 shadow-lg">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>18,000 Nodes</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* BOTTOM HUD DOCK: Ultra-Attractive 3D Creative Shape Selector Cards */}
        {/* ------------------------------------------------------------------ */}
        <div className="relative w-full pb-4 sm:pb-5 px-3 sm:px-6 z-10 pointer-events-auto flex flex-col items-center gap-2">
          
          {/* Glassmorphic Cyber Dock Container */}
          <div className="p-1.5 sm:p-2 rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto scrollbar-none">
            
            {/* 1. 3D Diamond (NOW IN 1ST PLACE) */}
            <button
              type="button"
              onClick={() => {
                setActiveShape('diamond');
                setIsAutoPlay(false);
              }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap group ${
                activeShape === 'diamond'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 ring-1 ring-teal-400 scale-[1.03]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeShape === 'diamond' ? 'bg-black/30' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <Gem className="w-3.5 h-3.5 text-teal-300" />
              </div>
              <span>3D Diamond</span>
              {activeShape === 'diamond' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* 2. Seedance Ballerina */}
            <button
              type="button"
              onClick={() => {
                setActiveShape('dancer');
                setIsAutoPlay(false);
              }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap group ${
                activeShape === 'dancer'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-600/30 ring-1 ring-fuchsia-400 scale-[1.03]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeShape === 'dancer' ? 'bg-black/30' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <User className="w-3.5 h-3.5 text-fuchsia-300" />
              </div>
              <span>Ballerina</span>
              {activeShape === 'dancer' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* 3. Neural AI Cortex */}
            <button
              type="button"
              onClick={() => {
                setActiveShape('brain');
                setIsAutoPlay(false);
              }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap group ${
                activeShape === 'brain'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400 scale-[1.03]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeShape === 'brain' ? 'bg-black/30' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <Brain className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <span>AI Cortex</span>
              {activeShape === 'brain' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* 4. Clapperboard */}
            <button
              type="button"
              onClick={() => {
                setActiveShape('clapperboard');
                setIsAutoPlay(false);
              }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap group ${
                activeShape === 'clapperboard'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-lg shadow-amber-500/30 ring-1 ring-amber-400 scale-[1.03]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeShape === 'clapperboard' ? 'bg-black/30' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <Clapperboard className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span>Clapperboard</span>
              {activeShape === 'clapperboard' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </div>

          {/* Interactive User Guide Footer Pill */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-slate-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Move cursor to sculpt nodes &bull; Click anywhere for shockwave pulse</span>
          </div>

        </div>

      </div>
    </div>
  );
};
