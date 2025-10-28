import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [objects, setObjects] = useState([]);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Handle object selection
  const handleCanvasClick = (event) => {
    if (!cameraRef.current || !sceneRef.current) return;

    // Calculate mouse position in normalized device coordinates
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.current.intersectObjects(
      sceneRef.current.children,
      true
    );

    if (intersects.length > 0) {
      // Find the first object that's not a helper
      const selected = intersects.find(
        (obj) => !(obj.object instanceof THREE.GridHelper) && 
                 !(obj.object instanceof THREE.AxesHelper)
      );
      
      if (selected) {
        setSelectedObject(selected.object);
      } else {
        setSelectedObject(null);
      }
    } else {
      setSelectedObject(null);
    }
  };

  // Add a new 3D object
  const addObject = (type) => {
    if (!sceneRef.current) return;

    let geometry, material, mesh;
    
    // Define colors for each shape type
    const colors = {
      box: 0x4caf50,    // Green
      sphere: 0x2196f3,  // Blue
      cylinder: 0xff9800 // Orange
    };

    material = new THREE.MeshStandardMaterial({
      color: colors[type] || 0x9e9e9e, // Default to gray if type not found
      roughness: 0.7,
      metalness: 0.3,
    });

    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      default:
        return;
    }

    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Random position within 10x10x10 cube
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );

    sceneRef.current.add(mesh);
    setObjects(prev => [...prev, mesh]);
  };

  return (
    <div className="app">
      <div className="toolbar">
        <h2>3D Editor</h2>
        <div className="toolbar-buttons">
          <button onClick={() => addObject('box')}>Add Box</button>
          <button onClick={() => addObject('sphere')}>Add Sphere</button>
          <button onClick={() => addObject('cylinder')}>Add Cylinder</button>
        </div>
      </div>
      
      <div className="main-content">
        <div className="sidebar">
          <h3>Properties</h3>
          {selectedObject && (
            <div className="properties-panel">
              <div>Type: {selectedObject.type}</div>
              <div>
                Position: 
                {`X: ${selectedObject.position.x.toFixed(2)}, `}
                {`Y: ${selectedObject.position.y.toFixed(2)}, `}
                {`Z: ${selectedObject.position.z.toFixed(2)}`}
              </div>
              <div>
                Rotation: 
                {`X: ${selectedObject.rotation.x.toFixed(2)}, `}
                {`Y: ${selectedObject.rotation.y.toFixed(2)}, `}
                {`Z: ${selectedObject.rotation.z.toFixed(2)}`}
              </div>
              <div>
                Scale: 
                {`X: ${selectedObject.scale.x.toFixed(2)}, `}
                {`Y: ${selectedObject.scale.y.toFixed(2)}, `}
                {`Z: ${selectedObject.scale.z.toFixed(2)}`}
              </div>
            </div>
          )}
        </div>
        
        <div className="canvas-container">
          <canvas 
            ref={canvasRef} 
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
