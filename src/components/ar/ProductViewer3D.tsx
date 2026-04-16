import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, Html } from '@react-three/drei';
import { Suspense } from 'react';
import { Product } from '@/data/mockData';

interface ProductViewer3DProps {
  product: Product;
}

function PlateWithTexture({ image, ingredients }: { image: string; ingredients?: string[] }) {
  return (
    <group>
      {/* Plate base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.08, 64]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Food image on plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.3, 64]} />
        <meshStandardMaterial
          color="#ddd"
          roughness={0.6}
        />
      </mesh>
      {/* Floating ingredient labels */}
      {ingredients?.slice(0, 3).map((ing, i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * 2;
        const z = Math.sin(angle) * 2;
        return (
          <Html
            key={ing}
            position={[x, 0.8 + i * 0.15, z]}
            center
            distanceFactor={6}
          >
            <div className="glass-strong px-3 py-1.5 rounded-full whitespace-nowrap">
              <span className="text-xs font-medium text-foreground">{ing}</span>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">Carregando 3D...</span>
      </div>
    </Html>
  );
}

const ProductViewer3D = ({ product }: ProductViewer3DProps) => {
  return (
    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-card border border-border">
      <Canvas
        camera={{ position: [0, 3, 4], fov: 45 }}
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />
          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
            <PlateWithTexture image={product.image} ingredients={product.ingredients} />
          </Float>
          <ContactShadows
            position={[0, -0.1, 0]}
            opacity={0.4}
            scale={8}
            blur={2}
            far={4}
          />
          <Environment preset="studio" />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.5}
            autoRotate
            autoRotateSpeed={2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ProductViewer3D;
