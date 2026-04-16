import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Move, RotateCw, ZoomIn, ZoomOut, Camera } from 'lucide-react';
import { Product } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';

interface WebXRViewerProps {
  product: Product;
  onClose: () => void;
}

type ARState = 'checking' | 'unsupported' | 'requesting' | 'active' | 'error';

const WebXRViewer = ({ product, onClose }: WebXRViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [arState, setArState] = useState<ARState>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [placed, setPlaced] = useState(false);
  const [scale, setScale] = useState(0.3);

  // Refs for WebXR session management
  const sessionRef = useRef<XRSession | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const plateGroupRef = useRef<THREE.Group | null>(null);
  const refSpaceRef = useRef<XRReferenceSpace | null>(null);
  const frameIdRef = useRef<number>(0);
  const scaleRef = useRef(scale);

  scaleRef.current = scale;

  // Check WebXR support
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.xr) {
        setArState('unsupported');
        setErrorMessage('WebXR não é suportado neste navegador. Use Chrome no Android para a melhor experiência AR.');
        return;
      }
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (supported) {
          setArState('requesting');
        } else {
          setArState('unsupported');
          setErrorMessage('AR imersivo não está disponível neste dispositivo. Use um dispositivo Android com Google Play Services for AR.');
        }
      } catch {
        setArState('unsupported');
        setErrorMessage('Erro ao verificar suporte AR. Verifique se o navegador tem permissão para acessar a câmera.');
      }
    };
    checkSupport();
  }, []);

  const createPlateModel = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group();

    // Plate base - white ceramic
    const plateGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.008, 64);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.3,
      metalness: 0.1,
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.castShadow = true;
    plate.receiveShadow = true;
    group.add(plate);

    // Plate rim
    const rimGeom = new THREE.TorusGeometry(0.15, 0.005, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.2,
      metalness: 0.3,
    });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.004;
    group.add(rim);

    // Food representation - colored sphere cluster
    const foodColors = [0xc0392b, 0x27ae60, 0xf39c12, 0x8e44ad, 0xe67e22];
    for (let i = 0; i < 5; i++) {
      const foodGeom = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 16, 16);
      const foodMat = new THREE.MeshStandardMaterial({
        color: foodColors[i % foodColors.length],
        roughness: 0.6,
      });
      const food = new THREE.Mesh(foodGeom, foodMat);
      const angle = (i / 5) * Math.PI * 2;
      const radius = 0.04 + Math.random() * 0.05;
      food.position.set(
        Math.cos(angle) * radius,
        0.01 + Math.random() * 0.02,
        Math.sin(angle) * radius
      );
      food.castShadow = true;
      group.add(food);
    }

    // Fake shadow on ground
    const shadowGeom = new THREE.CircleGeometry(0.2, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
    });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.001;
    group.add(shadow);

    group.visible = false;
    scene.add(group);
    plateGroupRef.current = group;

    return group;
  }, []);

  const startAR = useCallback(async () => {
    if (!canvasRef.current || !navigator.xr) return;

    try {
      setArState('requesting');

      // Setup Three.js
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
      cameraRef.current = camera;

      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambient);

      const directional = new THREE.DirectionalLight(0xffffff, 1.2);
      directional.position.set(1, 2, 1);
      directional.castShadow = true;
      scene.add(directional);

      const fill = new THREE.DirectionalLight(0xffffff, 0.4);
      fill.position.set(-1, 1, -1);
      scene.add(fill);

      // Reticle (placement indicator)
      const reticleGeom = new THREE.RingGeometry(0.08, 0.1, 32);
      const reticleMat = new THREE.MeshBasicMaterial({
        color: 0xc5930c,
        transparent: true,
        opacity: 0.8,
      });
      const reticle = new THREE.Mesh(reticleGeom, reticleMat);
      reticle.rotation.x = -Math.PI / 2;
      reticle.visible = false;
      scene.add(reticle);
      reticleRef.current = reticle;

      // Add inner dot to reticle
      const dotGeom = new THREE.CircleGeometry(0.01, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xc5930c,
        transparent: true,
        opacity: 0.6,
      });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.rotation.x = -Math.PI / 2;
      reticle.add(dot);

      // Create plate model
      createPlateModel(scene);

      // Request AR session
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay')! },
      });
      sessionRef.current = session;

      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(session);

      // Get reference space
      const refSpace = await session.requestReferenceSpace('local');
      refSpaceRef.current = refSpace;

      // Setup hit testing
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const hitTestSource = await session.requestHitTestSource!({ space: viewerSpace });
      hitTestSourceRef.current = hitTestSource!;

      setArState('active');

      // Handle select (tap to place)
      session.addEventListener('select', () => {
        if (reticleRef.current?.visible && plateGroupRef.current) {
          plateGroupRef.current.position.copy(reticleRef.current.position);
          plateGroupRef.current.visible = true;
          plateGroupRef.current.scale.setScalar(scaleRef.current);
          setPlaced(true);
        }
      });

      // Render loop
      renderer.setAnimationLoop((_, frame) => {
        if (!frame) return;

        const referenceSpace = renderer.xr.getReferenceSpace();
        if (!referenceSpace) return;

        // Hit testing
        if (hitTestSourceRef.current && reticleRef.current) {
          const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            if (pose) {
              reticleRef.current.visible = true;
              reticleRef.current.position.set(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
              );
              reticleRef.current.updateMatrixWorld(true);
            }
          } else {
            reticleRef.current.visible = false;
          }
        }

        // Update plate scale
        if (plateGroupRef.current && plateGroupRef.current.visible) {
          plateGroupRef.current.scale.lerp(
            new THREE.Vector3(scaleRef.current, scaleRef.current, scaleRef.current),
            0.1
          );
          // Gentle rotation
          plateGroupRef.current.rotation.y += 0.003;
        }

        renderer.render(scene, camera);
      });

      // Cleanup on session end
      session.addEventListener('end', () => {
        setArState('checking');
        cleanup();
        onClose();
      });
    } catch (err: any) {
      console.error('AR Session error:', err);
      setArState('error');
      setErrorMessage(err.message || 'Erro ao iniciar sessão AR');
    }
  }, [createPlateModel, onClose]);

  const cleanup = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.setAnimationLoop(null);
      rendererRef.current.dispose();
    }
    if (sessionRef.current) {
      sessionRef.current.end().catch(() => {});
    }
    hitTestSourceRef.current = null;
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleScaleUp = () => setScale((s) => Math.min(s + 0.05, 1.0));
  const handleScaleDown = () => setScale((s) => Math.max(s - 0.05, 0.1));

  const handleReplace = () => {
    if (plateGroupRef.current) {
      plateGroupRef.current.visible = false;
      setPlaced(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
      >
        {/* AR Canvas */}
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* DOM Overlay for AR UI */}
        <div id="ar-overlay" className="fixed inset-0 pointer-events-none z-50">
          {/* Top bar */}
          <div className="pointer-events-auto flex items-center justify-between p-4 pt-safe">
            <button
              onClick={() => {
                cleanup();
                onClose();
              }}
              className="glass-strong p-3 rounded-full"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="glass-strong px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-foreground">{product.name}</span>
            </div>

            <div className="glass-strong px-3 py-2 rounded-full">
              <span className="text-sm font-bold gold-text">R$ {product.price.toFixed(2)}</span>
            </div>
          </div>

          {/* Status messages */}
          {arState === 'checking' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div className="glass-strong rounded-2xl p-8 mx-4 text-center max-w-sm">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-foreground font-medium">Verificando suporte AR...</p>
              </div>
            </div>
          )}

          {arState === 'unsupported' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div className="glass-strong rounded-2xl p-8 mx-4 text-center max-w-sm">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-foreground mb-2">AR não disponível</h3>
                <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
                <button
                  onClick={onClose}
                  className="gold-gradient text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {arState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div className="glass-strong rounded-2xl p-8 mx-4 text-center max-w-sm">
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Erro</h3>
                <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setArState('requesting'); startAR(); }}
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

          {arState === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div className="glass-strong rounded-2xl p-8 mx-4 text-center max-w-sm">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">Iniciando câmera AR...</p>
                <p className="text-xs text-muted-foreground">Permita o acesso à câmera quando solicitado</p>
                {/* Auto-start AR */}
                <AutoStartAR onStart={startAR} />
              </div>
            </div>
          )}

          {/* AR Active UI */}
          {arState === 'active' && (
            <>
              {/* Placement instruction */}
              {!placed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-32 left-0 right-0 flex justify-center"
                >
                  <div className="glass-strong px-6 py-3 rounded-full pointer-events-auto">
                    <p className="text-sm text-foreground flex items-center gap-2">
                      <Move className="w-4 h-4 text-primary" />
                      Aponte para uma superfície e toque para posicionar
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Controls when placed */}
              {placed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto"
                >
                  <div className="glass-strong rounded-2xl p-3 flex items-center gap-3">
                    <button
                      onClick={handleScaleDown}
                      className="p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors"
                    >
                      <ZoomOut className="w-5 h-5 text-foreground" />
                    </button>

                    <div className="text-center px-2">
                      <p className="text-xs text-muted-foreground">Escala</p>
                      <p className="text-sm font-bold text-foreground">{Math.round(scale * 100)}%</p>
                    </div>

                    <button
                      onClick={handleScaleUp}
                      className="p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors"
                    >
                      <ZoomIn className="w-5 h-5 text-foreground" />
                    </button>

                    <div className="w-px h-8 bg-border" />

                    <button
                      onClick={handleReplace}
                      className="p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors"
                    >
                      <RotateCw className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Ingredient labels */}
              {placed && product.ingredients && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-24 right-4 space-y-2 pointer-events-auto"
                >
                  {product.ingredients.slice(0, 4).map((ing, i) => (
                    <motion.div
                      key={ing}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className="glass-strong px-3 py-1.5 rounded-full"
                    >
                      <span className="text-xs font-medium text-foreground">{ing}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper to auto-trigger AR start
function AutoStartAR({ onStart }: { onStart: () => void }) {
  const triggered = useRef(false);
  useEffect(() => {
    if (!triggered.current) {
      triggered.current = true;
      // Small delay for UI to render
      const timer = setTimeout(onStart, 500);
      return () => clearTimeout(timer);
    }
  }, [onStart]);
  return null;
}

export default WebXRViewer;
