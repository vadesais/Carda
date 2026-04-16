import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { X, ZoomIn, ZoomOut, RotateCw, Camera, FlipHorizontal } from 'lucide-react';
import { Product } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

interface CameraARViewerProps {
  product: Product;
  onClose: () => void;
}

const PlateModel = ({ product, scale }: { product: Product; scale: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} scale={scale}>
      {/* Plate */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.08, 64]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Rim */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 64]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Gold accent ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.02, 16, 64]} />
        <meshStandardMaterial color="#C5930C" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Food items */}
      {[0xc0392b, 0x27ae60, 0xf39c12, 0x8e44ad, 0xe67e22].map((color, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 0.4 + Math.random() * 0.5;
        return (
          <mesh
            key={i}
            castShadow
            position={[
              Math.cos(angle) * radius,
              0.1 + Math.random() * 0.15,
              Math.sin(angle) * radius,
            ]}
          >
            <sphereGeometry args={[0.15 + Math.random() * 0.12, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        );
      })}

      {/* Ingredient labels */}
      {product.ingredients?.slice(0, 3).map((ing, i) => {
        const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return (
          <Html
            key={ing}
            position={[Math.cos(angle) * 2, 0.8 + i * 0.3, Math.sin(angle) * 2]}
            center
            distanceFactor={8}
          >
            <div className="glass-strong px-2 py-1 rounded-full whitespace-nowrap">
              <span className="text-[10px] font-medium text-foreground">{ing}</span>
            </div>
          </Html>
        );
      })}
    </group>
  );
};

const CameraARViewer = ({ product, onClose }: CameraARViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scale, setScale] = useState(0.5);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setCameraError('');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permissão da câmera negada. Permita o acesso à câmera nas configurações do navegador.'
          : err.name === 'NotFoundError'
            ? 'Câmera não encontrada neste dispositivo.'
            : 'Erro ao acessar a câmera. Verifique as permissões.'
      );
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, startCamera]);

  const toggleCamera = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Camera Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* 3D Overlay */}
        {cameraReady && (
          <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
            <Canvas
              camera={{ position: [0, 3, 5], fov: 50 }}
              style={{ background: 'transparent' }}
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <directionalLight position={[-3, 4, -3]} intensity={0.4} />
              <PlateModel product={product} scale={scale} />
              <ContactShadows
                position={[0, -0.05, 0]}
                opacity={0.4}
                scale={8}
                blur={2}
                far={4}
              />
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate
                autoRotateSpeed={1.5}
                maxPolarAngle={Math.PI / 2}
                minDistance={2}
                maxDistance={10}
              />
              <Environment preset="city" />
            </Canvas>
          </div>
        )}

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-safe">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="glass-strong p-3 rounded-full"
          >
            <X className="w-5 h-5 text-foreground" />
          </motion.button>

          <div className="glass-strong px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-foreground">{product.name}</span>
          </div>

          <div className="glass-strong px-3 py-2 rounded-full">
            <span className="text-sm font-bold gold-text">R$ {product.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="glass-strong rounded-2xl p-8 mx-4 text-center max-w-sm">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-display font-bold text-foreground mb-2">Câmera indisponível</h3>
              <p className="text-sm text-muted-foreground mb-6">{cameraError}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="gold-gradient text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={onClose}
                  className="glass px-6 py-3 rounded-xl font-semibold text-sm text-foreground"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        {cameraReady && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 z-10"
          >
            {/* Hint */}
            <div className="glass-strong px-4 py-2 rounded-full mb-1">
              <p className="text-xs text-muted-foreground">
                Arraste para girar · Pinça para zoom
              </p>
            </div>

            <div className="glass-strong rounded-2xl p-3 flex items-center gap-3">
              <button
                onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
                className="p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors"
              >
                <ZoomOut className="w-5 h-5 text-foreground" />
              </button>

              <div className="text-center px-2 min-w-[50px]">
                <p className="text-xs text-muted-foreground">Escala</p>
                <p className="text-sm font-bold text-foreground">{Math.round(scale * 100)}%</p>
              </div>

              <button
                onClick={() => setScale(s => Math.min(s + 0.1, 1.5))}
                className="p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors"
              >
                <ZoomIn className="w-5 h-5 text-foreground" />
              </button>

              <div className="w-px h-8 bg-border" />

              <button
                onClick={() => setScale(0.5)}
                className="p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors"
              >
                <RotateCw className="w-5 h-5 text-foreground" />
              </button>

              <button
                onClick={toggleCamera}
                className="p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors"
              >
                <FlipHorizontal className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="glass-strong rounded-2xl p-8 text-center">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-foreground">Abrindo câmera...</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraARViewer;
