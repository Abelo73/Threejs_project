import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three-stdlib';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [objects, setObjects] = useState([]);
  const [gridSize, setGridSize] = useState(0.5);
  const [extrusionHeight, setExtrusionHeight] = useState(1.0);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const transformControlsRef = useRef(null);
  const [transformMode, setTransformMode] = useState('translate'); // 'translate', 'rotate', or 'scale'
  
  // Sketching mode state
  const [sketchMode, setSketchMode] = useState(null); // 'rectangle', 'circle', or null
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentSketch, setCurrentSketch] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  // Using the gridSize state variable for snapping

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
    controls.screenSpacePanning = true;
    controlsRef.current = controls;

    // Add transform controls
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode('translate');
    transformControls.setSize(0.8);
    transformControls.visible = false;
    scene.add(transformControls);
    transformControlsRef.current = transformControls;

    // Disable orbit controls when transform controls are in use
    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });

    // Highlight selected object
    const highlightSelectedObject = (object) => {
      // Remove highlight from previously selected object
      if (selectedObject) {
        selectedObject.material.emissive.set(0x000000);
      }
      
      // Apply highlight to newly selected object
      if (object) {
        object.material.emissive.set(0x333333);
        object.material.emissiveIntensity = 0.5;
        object.material.needsUpdate = true;
      }
    };

    // Update object properties when transformed
    const updateObjectTransform = () => {
      if (selectedObject) {
        // Create a new object with updated properties
        const updatedObject = {
          ...selectedObject,
          position: selectedObject.position.clone(),
          rotation: selectedObject.rotation.clone(),
          scale: selectedObject.scale.clone(),
          userData: { ...selectedObject.userData }
        };
        
        // Update the scene objects array
        setObjects(prevObjects => 
          prevObjects.map(obj => 
            obj.userData.id === selectedObject.userData.id ? updatedObject : obj
          )
        );
        
        // Update the selected object reference
        setSelectedObject(updatedObject);
      }
    };

    // Handle object selection
    const handleObjectSelect = (object) => {
      if (selectedObject === object) return;
      
      // Update highlight
      highlightSelectedObject(object);
      
      // Update transform controls
      if (object) {
        transformControlsRef.current.attach(object);
        transformControlsRef.current.visible = true;
        setSelectedObject(object);
      } else {
        transformControlsRef.current.detach();
        transformControlsRef.current.visible = false;
        setSelectedObject(null);
      }
    };

    // Listen for transform changes
    transformControls.addEventListener('change', updateObjectTransform);
    transformControls.addEventListener('mouseUp', updateObjectTransform);
    
    // Set transform mode
    const setTransformMode = (mode) => {
      transformControlsRef.current.setMode(mode);
      setCurrentTransformMode(mode);
    };

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

  // Snap a value to the grid if snapToGrid is enabled
  const snapValue = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Get intersection point on XZ plane
  const getIntersectionPoint = (event) => {
    if (!cameraRef.current || !sceneRef.current) return null;
    
    // Calculate mouse position in normalized device coordinates
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Create a plane at y=0 for XZ plane intersection
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse.current, cameraRef.current);
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    // Snap to grid if enabled
    if (snapToGrid) {
      intersection.x = snapValue(intersection.x);
      intersection.z = snapValue(intersection.z);
    }
    
    return intersection;
  };

  // Create a rectangle preview
  const createRectangle = (start, end) => {
    if (!sceneRef.current) return;
    
    // Remove previous preview if it exists
    if (currentSketch) {
      sceneRef.current.remove(currentSketch);
    }
    
    const width = Math.abs(end.x - start.x);
    const depth = Math.abs(end.z - start.z);
    const centerX = (start.x + end.x) / 2;
    const centerZ = (start.z + end.z) / 2;
    
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, -depth/2);
    shape.lineTo(width/2, -depth/2);
    shape.lineTo(width/2, depth/2);
    shape.lineTo(-width/2, depth/2);
    shape.lineTo(-width/2, -depth/2);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    
    const rectangle = new THREE.Mesh(geometry, material);
    rectangle.position.set(centerX, 0, centerZ);
    rectangle.rotation.x = -Math.PI / 2; // Rotate to XZ plane
    
    sceneRef.current.add(rectangle);
    setCurrentSketch(rectangle);
    return rectangle;
  };
  
  // Create a circle preview
  const createCircle = (center, radius) => {
    if (!sceneRef.current) return;
    
    // Remove previous preview if it exists
    if (currentSketch) {
      sceneRef.current.remove(currentSketch);
    }
    
    const segments = 32;
    const geometry = new THREE.CircleGeometry(radius, segments);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(center.x, 0, center.z);
    circle.rotation.x = -Math.PI / 2; // Rotate to XZ plane
    
    sceneRef.current.add(circle);
    setCurrentSketch(circle);
    return circle;
  };

  // Handle mouse down for sketching
  const handleMouseDown = (event) => {
    if (!sketchMode) {
      // If not in sketch mode, handle object selection
      handleCanvasClick(event);
      return;
    }
    
    const point = getIntersectionPoint(event);
    if (!point) return;
    
    setIsDrawing(true);
    setStartPoint(point);
    
    // Create initial sketch
    if (sketchMode === 'rectangle') {
      createRectangle(point, point);
    } else if (sketchMode === 'circle') {
      createCircle(point, 0.1);
    }
  };
  
  // Handle mouse move for sketching
  const handleMouseMove = (event) => {
    if (!isDrawing || !startPoint || !sketchMode) return;
    
    const point = getIntersectionPoint(event);
    if (!point) return;
    
    if (sketchMode === 'rectangle') {
      createRectangle(startPoint, point);
    } else if (sketchMode === 'circle') {
      const radius = startPoint.distanceTo(point);
      createCircle(startPoint, radius);
    }
  };
  
  // Extrude a 2D shape into 3D
  const extrudeShape = (shapeMesh, height = 1.0) => {
    if (!shapeMesh || !sceneRef.current) return null;
    
    let geometry;
    
    if (shapeMesh.geometry.type === 'ShapeGeometry') {
      // For rectangles and other shapes
      const shape = new THREE.Shape();
      shape.moveTo(-0.5, -0.5);
      shape.lineTo(0.5, -0.5);
      shape.lineTo(0.5, 0.5);
      shape.lineTo(-0.5, 0.5);
      shape.lineTo(-0.5, -0.5);
      
      const extrudeSettings = {
        steps: 1,
        depth: height,
        bevelEnabled: false
      };
      
      geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Scale the geometry to match the original shape's dimensions
      geometry.scale(shapeMesh.scale.x * 2, shapeMesh.scale.z * 2, 1);
    } else if (shapeMesh.geometry.type === 'CircleGeometry') {
      // For circles
      const radius = shapeMesh.geometry.parameters.radius;
      const segments = shapeMesh.geometry.parameters.segments;
      geometry = new THREE.CylinderGeometry(radius, radius, height, segments, 1, false);
    } else {
      return null; // Unsupported shape type
    }
    
    // Create material with the same color as the original shape
    const material = new THREE.MeshPhongMaterial({
      color: shapeMesh.material.color,
      side: THREE.DoubleSide,
      flatShading: true
    });
    
    // Create the 3D mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position the extruded shape
    mesh.position.copy(shapeMesh.position);
    mesh.position.y = height / 2; // Center vertically
    
    // Add to scene
    sceneRef.current.add(mesh);
    
    // Add to objects array
    setObjects(prev => [...prev, mesh]);
    
    return mesh;
  };
  
  // Extrude the selected object
  const handleExtrude = () => {
    if (!selectedObject) return;
    
    // Check if the selected object is a 2D shape
    const is2DShape = selectedObject.geometry && 
                     (selectedObject.geometry.type === 'ShapeGeometry' || 
                      selectedObject.geometry.type === 'CircleGeometry');
    
    if (is2DShape) {
      const extrudedMesh = extrudeShape(selectedObject, extrusionHeight);
      if (extrudedMesh) {
        // Select the new extruded mesh
        setSelectedObject(extrudedMesh);
        
        // Remove the original 2D shape
        sceneRef.current.remove(selectedObject);
        setObjects(prev => prev.filter(obj => obj.uuid !== selectedObject.uuid));
      }
    }
  };
  
  // Handle mouse up for sketching
  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !sketchMode) {
      setIsDrawing(false);
      return;
    }
    
    // Reset drawing state
    setIsDrawing(false);
    
    // Keep the current sketch as a permanent object
    if (currentSketch) {
      currentSketch.material.opacity = 0.3; // Make it less prominent
      currentSketch.userData.is2DShape = true; // Mark as 2D shape for later reference
      setObjects(prev => [...prev, currentSketch]);
      setCurrentSketch(null);
    }
  };

  // Handle canvas click (for object selection when not in sketch mode)
  const handleCanvasClick = (event) => {
    if (!cameraRef.current || !sceneRef.current || !transformControlsRef.current) return;
    if (sketchMode) return; // Skip object selection in sketch mode

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
      // Find the first object that's not a helper or transform controls
      const selected = intersects.find(
        (obj) => !(obj.object instanceof THREE.GridHelper) && 
                 !(obj.object instanceof THREE.AxesHelper) &&
                 !(obj.object instanceof TransformControls) &&
                 !(obj.object.parent instanceof TransformControls) &&
                 !(obj.object instanceof THREE.Mesh && 
                   (obj.object.geometry.type === 'ShapeGeometry' || 
                    obj.object.geometry.type === 'CircleGeometry'))
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

  // Handle object selection
  const handleObjectSelect = (object) => {
    if (selectedObject === object) return;
    
    // Update highlight
    highlightSelectedObject(object);
    
    // Update transform controls and handle selection highlighting
    useEffect(() => {
      if (!transformControlsRef.current) return;
      
      let originalMaterials = [];
      
      const cleanup = () => {
        // Restore original materials
        originalMaterials.forEach(({ object, emissive, emissiveIntensity }) => {
          if (object.material) {
            object.material.emissive.copy(emissive);
            object.material.emissiveIntensity = emissiveIntensity;
            object.material.needsUpdate = true;
          }
        });
        originalMaterials = [];
      };
      
      if (object) {
        // Store original materials for cleanup
        object.traverse((child) => {
          if (child.material) {
            // Handle both single material and array of materials
            const materials = Array.isArray(child.material) 
              ? child.material 
              : [child.material];
              
            materials.forEach((material) => {
              originalMaterials.push({
                object: child,
                emissive: material.emissive.clone(),
                emissiveIntensity: material.emissiveIntensity
              });
              
              // Apply highlight
              material.emissive.set(0x444444);
              material.emissiveIntensity = 0.7;
              material.needsUpdate = true;
            });
          }
        });
        
        // Update transform controls
        transformControlsRef.current.attach(object);
        transformControlsRef.current.visible = true;
        
        // Ensure transform controls are on top
        transformControlsRef.current.renderOrder = 999;
        
        return cleanup;
      } else {
        transformControlsRef.current.detach();
        transformControlsRef.current.visible = false;
      }
    }, [selectedObject, transformMode]);
    
    // Update transform controls
    if (object) {
      transformControlsRef.current.attach(object);
      transformControlsRef.current.visible = true;
      setSelectedObject(object);
    } else {
      transformControlsRef.current.detach();
      transformControlsRef.current.visible = false;
      setSelectedObject(null);
    }
  };

  // Add object
  const addObject = (type) => {
    let geometry;
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
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

    const mesh = new THREE.Mesh(geometry, material);
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
        <div className="toolbar-section">
          <h3>3D Shapes</h3>
          <div className="toolbar-buttons">
            <button onClick={() => addObject('box')}>Add Box</button>
            <button onClick={() => addObject('sphere')}>Add Sphere</button>
            <button onClick={() => addObject('cylinder')}>Add Cylinder</button>
          </div>
        </div>
        <div className="toolbar-section transform-modes">
          <h3>Transform Modes</h3>
          <div className="toolbar-buttons">
            <button 
              className={transformMode === 'translate' ? 'active' : ''}
              onClick={() => setTransformMode('translate')}
            >
              Move
              <span className="tooltip">Move (G) - Drag to position objects</span>
            </button>
            <button 
              className={transformMode === 'rotate' ? 'active' : ''}
              onClick={() => setTransformMode('rotate')}
            >
              Rotate
              <span className="tooltip">Rotate (R) - Click and drag to rotate</span>
            </button>
            <button 
              className={transformMode === 'scale' ? 'active' : ''}
              onClick={() => setTransformMode('scale')}
            >
              Scale
              <span className="tooltip">Scale (S) - Drag to resize objects</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="main-content">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>2D Sketching</h3>
            <div className="toolbar-buttons vertical">
              <button 
                className={sketchMode === 'rectangle' ? 'active' : ''}
                onClick={() => setSketchMode(sketchMode === 'rectangle' ? null : 'rectangle')}
              >
                Rectangle
              </button>
              <button 
                className={sketchMode === 'circle' ? 'active' : ''}
                onClick={() => setSketchMode(sketchMode === 'circle' ? null : 'circle')}
              >
                Circle
              </button>
              <div className="toggle-container">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span>Snap to Grid</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>2D to 3D</h3>
            <div className="toolbar-buttons vertical">
              <button 
                onClick={handleExtrude}
                disabled={!selectedObject || !selectedObject.userData?.is2DShape}
              >
                Extrude to 3D
              </button>
              <div className="property-control">
                <label>Height:</label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="5" 
                  step="0.1" 
                  value={extrusionHeight}
                  onChange={(e) => setExtrusionHeight(parseFloat(e.target.value))}
                />
                <span>{extrusionHeight.toFixed(1)}</span>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Properties</h3>
            {selectedObject ? (
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
            ) : (
              <div className="properties-panel empty">
                Select an object to view properties
              </div>
            )}
          </div>
        </div> {/* Close sidebar div */}
        
        <div className="canvas-container">
          <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: sketchMode ? 'crosshair' : 'default' }}
          />
          {sketchMode && (
            <div className="sketch-mode-indicator">
              Sketch Mode: {sketchMode} {snapToGrid ? '(Snap to Grid)' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
