import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ultra-fine point-based particle engine for Hero section.
 * Features:
 * - Pinpoint micro-particles with luminous vertex gradients (no large shapes).
 * - Custom quintic/exponential easing functions for fluid, organic flow.
 * - Center obstacle avoidance zone protecting the Hero title, pricing cards, and navigation.
 * - Fluid mouse cursor interaction with fluid vortex swirl and smooth spring relaxation.
 */
export const ThreeBackground3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 700;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

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

    // 3. Ultra-Crisp Point Particle Texture (Soft luminous pinpoint dot)
    const createPointTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.55, 'rgba(240, 245, 255, 0.45)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createPointTexture();

    // 4. Particle System Configuration
    const PARTICLE_COUNT = 3200;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);

    // Color Palette: Luminous Cyan, Electric Fuchsia, Starlight Amber, Deep Purple, Frost White
    const palette = [
      new THREE.Color('#38bdf8'), // Cyan-400
      new THREE.Color('#c084fc'), // Purple-400
      new THREE.Color('#f472b6'), // Pink-400
      new THREE.Color('#e879f9'), // Fuchsia-400
      new THREE.Color('#fcd34d'), // Amber-300
      new THREE.Color('#ffffff'), // White
    ];

    // Distribute particles across an expansive volumetric field, keeping density towards edges
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;

      // Spread widely across viewport
      const angle = Math.random() * Math.PI * 2;
      const radiusX = 8 + Math.pow(Math.random(), 0.7) * 26;
      const radiusY = 6 + Math.pow(Math.random(), 0.7) * 18;

      let x = Math.cos(angle) * radiusX;
      let y = Math.sin(angle) * radiusY;
      let z = (Math.random() - 0.5) * 16;

      // Soft push away from center immediately on spawn
      const centerDistSq = (x * x) / (12 * 12) + (y * y) / (7.5 * 7.5);
      if (centerDistSq < 1.0) {
        const factor = 1.0 / Math.sqrt(centerDistSq);
        x *= factor * 1.15;
        y *= factor * 1.15;
      }

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      originalPositions[idx] = x;
      originalPositions[idx + 1] = y;
      originalPositions[idx + 2] = z;

      velocities[idx] = 0;
      velocities[idx + 1] = 0;
      velocities[idx + 2] = 0;

      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.4 + Math.random() * 0.8;

      // Assign subtle radiant colors
      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      colors[idx] = chosenColor.r;
      colors[idx + 1] = chosenColor.g;
      colors[idx + 2] = chosenColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Ultra-fine point sizing (size: 0.22 ensures sharp micro-points instead of chunky blobs)
    const material = new THREE.PointsMaterial({
      size: 0.22,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // 5. Custom Easing Functions for Organic Fluid Flow
    // Quintic smootherstep easing function (smoother, higher-order continuity than cubic)
    const quinticSmooth = (t: number) => {
      const c = Math.max(0, Math.min(1, t));
      return c * c * c * (c * (c * 6 - 15) + 10);
    };

    // Exponential fluid ease-out for organic spring response
    const fluidEaseOut = (t: number) => {
      const c = Math.max(0, Math.min(1, t));
      return 1 - Math.pow(1 - c, 4);
    };

    // 6. Mouse Tracking in 3D Space
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseNorm = new THREE.Vector2(-999, -999);
    const targetMouseNorm = new THREE.Vector2(-999, -999);
    const mouse3D = new THREE.Vector3(-999, -999, 0);
    let hasMouse = false;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      hasMouse = true;
    };

    const onPointerLeave = () => {
      targetMouseNorm.set(-999, -999);
      hasMouse = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // 7. Resize Observer
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

    // 8. Fluid Physics Simulation Loop (60 FPS)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    // Center Avoidance Zone Dimensions (Hero navigation cards & headline region)
    const centerRx = 11.8;
    const centerRy = 7.4;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      // Smooth mouse interpolation
      if (hasMouse) {
        mouseNorm.x += (targetMouseNorm.x - mouseNorm.x) * 0.15;
        mouseNorm.y += (targetMouseNorm.y - mouseNorm.y) * 0.15;

        raycaster.setFromCamera(mouseNorm, camera);
        const hit = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, hit);
        if (hit) {
          mouse3D.copy(hit);
        }
      } else {
        mouse3D.set(-999, -999, 0);
      }

      // Parallax camera easing
      const targetCamX = hasMouse ? mouseNorm.x * 2.2 : Math.sin(time * 0.2) * 1.0;
      const targetCamY = hasMouse ? mouseNorm.y * 1.8 : Math.cos(time * 0.15) * 0.8;
      camera.position.x += (targetCamX - camera.position.x) * 0.04;
      camera.position.y += (targetCamY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const pos = posAttr.array as Float32Array;

      // Fluid Simulation Parameters
      const damping = 0.90;
      const returnSpring = 1.4;
      const mouseRadius = 8.5;
      const mouseRadiusSq = mouseRadius * mouseRadius;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        let px = pos[idx];
        let py = pos[idx + 1];
        let pz = pos[idx + 2];

        const ox = originalPositions[idx];
        const oy = originalPositions[idx + 1];
        const oz = originalPositions[idx + 2];

        let vx = velocities[idx];
        let vy = velocities[idx + 1];
        let vz = velocities[idx + 2];

        const phase = phases[i];
        const speed = speeds[i];

        // 1. Organic Fluid Stream Currents (harmonic curl noise approximation)
        const flowAngle1 = (py * 0.14) + (time * 0.35 * speed) + phase;
        const flowAngle2 = (px * 0.14) - (time * 0.30 * speed) + phase * 0.7;

        const currentX = Math.cos(flowAngle1) * 0.55;
        const currentY = Math.sin(flowAngle2) * 0.45;
        const currentZ = Math.sin(flowAngle1 + flowAngle2) * 0.25;

        vx += currentX * delta;
        vy += currentY * delta;
        vz += currentZ * delta;

        // 2. Soft Spring to Home Orbit with Custom Easing
        const distToOriginX = ox - px;
        const distToOriginY = oy - py;
        const distToOriginZ = oz - pz;
        const distFromHome = Math.sqrt(
          distToOriginX * distToOriginX +
          distToOriginY * distToOriginY +
          distToOriginZ * distToOriginZ
        );

        if (distFromHome > 0.01) {
          // Use fluidEaseOut so return force is gentle near home and restorative when displaced
          const easeRatio = fluidEaseOut(Math.min(distFromHome / 12, 1.0));
          const springScale = returnSpring * easeRatio;
          vx += (distToOriginX / distFromHome) * springScale * delta;
          vy += (distToOriginY / distFromHome) * springScale * delta;
          vz += (distToOriginZ / distFromHome) * springScale * delta;
        }

        // 3. Center Obstacle Avoidance (Avoids Hero Title, Pricing Cards & Navigation)
        const centerDistSq = (px * px) / (centerRx * centerRx) + (py * py) / (centerRy * centerRy);
        if (centerDistSq < 1.0) {
          const normDist = Math.sqrt(centerDistSq);
          const penetration = 1.0 - normDist; // 1 at core center, 0 at border
          const repelEase = quinticSmooth(penetration); // Custom quintic easing curve

          const centerAngle = Math.atan2(py, px);
          // Strong outward push + tangential fluid deflection around center obstacle
          const outwardPush = repelEase * 32.0 * delta;
          const tangentialPush = (i % 2 === 0 ? 1 : -1) * repelEase * 14.0 * delta;

          vx += Math.cos(centerAngle) * outwardPush - Math.sin(centerAngle) * tangentialPush;
          vy += Math.sin(centerAngle) * outwardPush + Math.cos(centerAngle) * tangentialPush;
          vz += (Math.sin(i) > 0 ? 1 : -1) * repelEase * 4.0 * delta;
        }

        // 4. Fluid Mouse Cursor Interaction (Organic Easing + Vortex Swirl)
        if (hasMouse) {
          const mdx = px - mouse3D.x;
          const mdy = py - mouse3D.y;
          const mdz = pz - mouse3D.z;
          const distSq = mdx * mdx + mdy * mdy + mdz * mdz;

          if (distSq < mouseRadiusSq && distSq > 0.02) {
            const dist = Math.sqrt(distSq);
            const normForce = 1.0 - dist / mouseRadius;
            // Custom quintic easing for ultra-smooth fluid repulsion
            const easeForce = quinticSmooth(normForce);

            const mouseAngle = Math.atan2(mdy, mdx);
            const repelForce = easeForce * 36.0 * delta;
            const vortexForce = easeForce * 20.0 * delta;

            // Combination of radial repulsion and fluid vortex swirl
            vx += Math.cos(mouseAngle) * repelForce - Math.sin(mouseAngle) * vortexForce;
            vy += Math.sin(mouseAngle) * repelForce + Math.cos(mouseAngle) * vortexForce;
            vz += (pz > 0 ? 1 : -1) * easeForce * 8.0 * delta;
          }
        }

        // 5. Apply Drag / Damping
        vx *= damping;
        vy *= damping;
        vz *= damping;

        velocities[idx] = vx;
        velocities[idx + 1] = vy;
        velocities[idx + 2] = vz;

        pos[idx] = px + vx;
        pos[idx + 1] = py + vy;
        pos[idx + 2] = pz + vz;
      }

      posAttr.needsUpdate = true;

      // Gentle global rotation
      particleSystem.rotation.z = time * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      resizeObserver.disconnect();

      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      renderer.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
      style={{ willChange: 'transform' }}
    />
  );
};
