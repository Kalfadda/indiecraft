import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Grid, Environment, Html } from '@react-three/drei';
import { convertFileSrc } from '@tauri-apps/api/core';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { useTheme } from '@/stores/themeStore';

interface ModelPreviewProps {
  filePath: string;
  extension: string;
}

interface ModelStats {
  vertices: number;
  triangles: number;
}

function LoadingSpinner() {
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        color: '#888',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid #333',
          borderTopColor: '#888',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: 12 }}>Loading model...</span>
      </div>
    </Html>
  );
}

function Model({ filePath, extension, onStats, onError }: ModelPreviewProps & {
  onStats: (stats: ModelStats) => void;
  onError: (error: string) => void;
}) {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;

    const loadModel = async () => {
      try {
        // Convert local file path to URL accessible by webview
        const fileUrl = convertFileSrc(filePath);

        let loader: OBJLoader | FBXLoader | GLTFLoader | STLLoader;

        switch (extension.toLowerCase()) {
          case 'obj':
            loader = new OBJLoader();
            break;
          case 'fbx':
            loader = new FBXLoader();
            break;
          case 'gltf':
          case 'glb':
            loader = new GLTFLoader();
            break;
          case 'stl':
            loader = new STLLoader();
            break;
          default:
            onError(`Unsupported format: .${extension}`);
            return;
        }

        // Use a promise wrapper for consistent handling
        const result = await new Promise<THREE.Object3D>((resolve, reject) => {
          if (loader instanceof STLLoader) {
            // STL returns geometry, not object
            loader.load(
              fileUrl,
              (geometry) => {
                const material = new THREE.MeshStandardMaterial({
                  color: 0x888888,
                  metalness: 0.3,
                  roughness: 0.7,
                });
                const mesh = new THREE.Mesh(geometry, material);
                resolve(mesh);
              },
              undefined,
              reject
            );
          } else {
            loader.load(
              fileUrl,
              (result) => {
                const object = 'scene' in result ? result.scene : result;
                resolve(object);
              },
              undefined,
              reject
            );
          }
        });

        if (cancelled) return;

        // Calculate stats
        let vertices = 0;
        let triangles = 0;

        result.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const geometry = child.geometry;
            if (geometry.index) {
              triangles += geometry.index.count / 3;
            } else if (geometry.attributes.position) {
              triangles += geometry.attributes.position.count / 3;
            }
            if (geometry.attributes.position) {
              vertices += geometry.attributes.position.count;
            }

            // Ensure material is visible
            if (!child.material) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.3,
                roughness: 0.7,
              });
            } else if (Array.isArray(child.material)) {
              child.material = child.material.map(m => {
                if (!m) {
                  return new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    metalness: 0.3,
                    roughness: 0.7,
                  });
                }
                return m;
              });
            }
          }
        });

        onStats({ vertices, triangles: Math.floor(triangles) });

        // Auto-scale and center
        const box = new THREE.Box3().setFromObject(result);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;
        result.scale.multiplyScalar(scale);

        // Center the model
        box.setFromObject(result);
        const center = box.getCenter(new THREE.Vector3());
        result.position.sub(center);

        setModel(result);
      } catch (e) {
        if (!cancelled) {
          console.error('Model load error:', e);
          onError('Failed to load model');
        }
      }
    };

    loadModel();
    return () => { cancelled = true; };
  }, [filePath, extension, onStats, onError]);

  // Slow rotation
  useFrame((_, delta) => {
    if (groupRef.current && model) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  if (!model) {
    return <LoadingSpinner />;
  }

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

export function ModelPreview({ filePath, extension }: ModelPreviewProps) {
  const theme = useTheme();
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Reset state when file changes
  useEffect(() => {
    setStats(null);
    setError(null);
  }, [filePath]);

  const bgGradient = useMemo(() => {
    return `linear-gradient(180deg, ${theme.colors.card} 0%, ${theme.colors.background} 100%)`;
  }, [theme.colors.card, theme.colors.background]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgGradient,
        borderRadius: 8,
        color: theme.colors.error,
        gap: 8,
      }}>
        <span style={{ fontSize: 32 }}>⚠️</span>
        <span style={{ fontSize: 14 }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: 300,
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        style={{
          background: bgGradient,
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />

        <Suspense fallback={<LoadingSpinner />}>
          <Center>
            <Model
              filePath={filePath}
              extension={extension}
              onStats={setStats}
              onError={setError}
            />
          </Center>
        </Suspense>

        <OrbitControls
          enablePan={true}
          minDistance={1}
          maxDistance={10}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
        />

        <Grid
          position={[0, -1.5, 0]}
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#333"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#444"
          fadeDistance={10}
          fadeStrength={1}
        />
      </Canvas>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        gap: 4,
      }}>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Stop rotation' : 'Start rotation'}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: autoRotate ? theme.colors.primary : 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          🔄
        </button>
      </div>
    </div>
  );
}
