import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AtmosphericGlobeProps {
  city: 'Lahore' | 'Karachi';
  pm25: number;
}

export const AtmosphericGlobe: React.FC<AtmosphericGlobeProps> = ({ city, pm25 }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 320;
    const height = 280;

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.replaceChildren(renderer.domElement);

    // Particle Cloud representing particulate PM2.5 suspension
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Color gradient based on PM2.5 severity
    const isSmog = pm25 > 150;
    const baseColor = isSmog ? new THREE.Color('#E53E3E') : new THREE.Color('#6CAE4F');
    const accentColor = isSmog ? new THREE.Color('#9B1C1C') : new THREE.Color('#99DE7B');

    const radius = 68;
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius + (Math.random() - 0.5) * 16;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const mixed = baseColor.clone().lerp(accentColor, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Glowing Inner Atmospheric Sphere
    const sphereGeo = new THREE.SphereGeometry(radius * 0.92, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: isSmog ? 0x2A1010 : 0x1A2E1A,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Orbital Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      particleSystem.rotation.y += 0.0035;
      particleSystem.rotation.x += 0.0015;
      sphere.rotation.y -= 0.002;
      renderer.render(scene, camera);
    };
    animate();

    // Handle container resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, [city, pm25]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '280px' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        pointerEvents: 'none'
      }}>
        <span>3D Particulate Telemetry: <strong>{city}</strong></span>
        <span>{pm25 > 150 ? '● Inversion Alert' : '● Normal Dispersion'}</span>
      </div>
    </div>
  );
};
