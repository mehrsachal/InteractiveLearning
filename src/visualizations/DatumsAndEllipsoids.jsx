< !DOCTYPE html >
    <html lang="en">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>ELI5: Ellipsoids & Datum Shifts</title>
                    <!-- Tailwind CSS for styling -->
                    <script src="https://cdn.tailwindcss.com"></script>
                    <!-- Three.js for 3D visualization -->
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                    <!-- OrbitControls for interaction -->
                    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                        body {
                            font - family: 'Inter', sans-serif;
                        background-color: #0f172a; /* slate-900 */
                        color: #f8fafc; /* slate-50 */
                        margin: 0;
                        padding: 0;
                        overflow: hidden; /* Prevent scrolling, 3D canvas takes over */
        }

                        #canvas-container {
                            width: 100vw;
                        height: 100vh;
                        position: absolute;
                        top: 0;
                        left: 0;
                        z-index: 0;
        }

                        #ui-layer {
                            position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none; /* Let clicks pass through to canvas where needed */
                        z-index: 10;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        padding: 1.5rem;
        }

                        /* Make UI panels interactive */
                        .interactive-panel {
                            pointer - events: auto;
                        background: rgba(30, 41, 59, 0.85); /* slate-800 with opacity */
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(148, 163, 184, 0.2); /* slate-400 */
                        border-radius: 1rem;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
        }

                        /* Custom scrollbar for info panel */
                        .info-scroll::-webkit-scrollbar {
                            width: 6px;
        }
                        .info-scroll::-webkit-scrollbar-track {
                            background: rgba(15, 23, 42, 0.5);
                        border-radius: 4px;
        }
                        .info-scroll::-webkit-scrollbar-thumb {
                            background: rgba(100, 116, 139, 0.8);
                        border-radius: 4px;
        }

                        /* Radio button custom styling */
                        input[type="radio"] {
                            accent - color: #3b82f6; /* blue-500 */
        }

                        /* Coordinate jump animation */
                        @keyframes pulse {
                            0 % { transform: scale(1); opacity: 0.8; }
            50% {transform: scale(1.5); opacity: 0.2; }
                        100% {transform: scale(1); opacity: 0.8; }
        }

                        .pulse-marker {
                            position: absolute;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background-color: #ef4444; /* red-500 */
                        transform: translate(-50%, -50%);
                        animation: pulse 2s infinite;
                        pointer-events: none;
                        display: none;
                        z-index: 20;
        }

                        /* Legend dots */
                        .dot {
                            width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        display: inline-block;
                        margin-right: 8px;
        }
                        .dot-geoid {background - color: #4ade80; } /* green-400 */
                        .dot-ellipsoid {background - color: #60a5fa; } /* blue-400 */
                        .dot-marker {background - color: #f87171; } /* red-400 */

                    </style>
                </head>
                <body>

                    <!-- 3D Canvas Container -->
                    <div id="canvas-container"></div>

                    <!-- 2D Pulse Marker for screen-space coordinate tracking -->
                    <div id="screen-marker" class="pulse-marker"></div>

                    <!-- UI Overlay -->
                    <div id="ui-layer">

                        <!-- Header -->
                        <header class="flex justify-between items-start w-full max-w-7xl mx-auto">
                            <div class="interactive-panel p-5 max-w-md">
                                <h1 class="text-2xl font-bold text-white mb-2 tracking-tight">ELI5: Datums & Ellipsoids</h1>
                                <p class="text-sm text-slate-300 leading-relaxed">
                                    The Earth isn't perfectly round; it's lumpy like a potato. To make maps, we use smooth mathematical shapes called <strong>Ellipsoids</strong> to approximate it. A <strong>Datum</strong> connects this shape to the real earth.
                                </p>
                            </div>

                            <!-- Controls Panel -->
                            <div class="interactive-panel p-5 w-72">
                                <h2 class="text-lg font-semibold text-white mb-4 border-b border-slate-600 pb-2">Select a Datum</h2>

                                <div class="space-y-3">
                                    <label class="flex items-center cursor-pointer group">
                                        <input type="radio" name="datum" value="wgs84" class="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-600 focus:ring-2" checked>
                                            <span class="ml-3 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                                WGS 84 (Global Standard)
                                                <span class="block text-xs text-slate-400 mt-0.5">Best fit for the whole earth. Used by GPS.</span>
                                            </span>
                                    </label>

                                    <label class="flex items-center cursor-pointer group mt-4">
                                        <input type="radio" name="datum" value="nad27" class="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-600 focus:ring-2">
                                            <span class="ml-3 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                                NAD 27 (Local, N. America)
                                                <span class="block text-xs text-slate-400 mt-0.5">Fits North America perfectly, but terribly elsewhere.</span>
                                            </span>
                                    </label>

                                    <label class="flex items-center cursor-pointer group mt-4">
                                        <input type="radio" name="datum" value="tokyo" class="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-600 focus:ring-2">
                                            <span class="ml-3 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                                Tokyo Datum (Local, Japan)
                                                <span class="block text-xs text-slate-400 mt-0.5">Shifted to fit the Japanese islands closely.</span>
                                            </span>
                                    </label>
                                </div>

                                <div class="mt-6 pt-4 border-t border-slate-600">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm text-slate-300">Show Lumpy Earth (Geoid)</span>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="toggle-geoid" class="sr-only peer" checked>
                                                <div class="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <!-- Footer / Info Status -->
                        <div class="flex justify-between items-end w-full max-w-7xl mx-auto mt-auto">

                            <!-- Legend -->
                            <div class="interactive-panel p-4 text-sm flex gap-6">
                                <div class="flex items-center text-slate-300"><span class="dot dot-geoid"></span> True Shape (Exaggerated)</div>
                                <div class="flex items-center text-slate-300"><span class="dot dot-ellipsoid"></span> Mathematical Ellipsoid</div>
                                <div class="flex items-center text-slate-300"><span class="dot dot-marker shadow-[0_0_8px_rgba(248,113,113,0.8)]"></span> Fixed Coordinate Point</div>
                            </div>

                            <!-- Coordinate Shift Explanation -->
                            <div class="interactive-panel p-5 max-w-sm ml-auto">
                                <h3 class="text-white font-semibold mb-2">The "Jump" Effect</h3>
                                <div id="shift-info" class="text-sm text-slate-300 space-y-2 info-scroll overflow-y-auto max-h-32 pr-2">
                                    <p>Notice the red marker? It represents a fixed GPS coordinate (e.g., Lat: 40°, Lon: -100°).</p>
                                    <p>Because different datums shift the mathematical sphere (blue grid) relative to the earth, the physical location of that coordinate "jumps" when you switch datums!</p>
                                    <p id="jump-distance" class="text-blue-400 font-medium mt-2">Current Model: Global center.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <script>
        // --- Three.js Setup ---
                        const container = document.getElementById('canvas-container');

                        // Scene
                        const scene = new THREE.Scene();
                        scene.background = new THREE.Color(0x0f172a); // Match slate-900
                        scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

                        // Camera
                        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
                        camera.position.set(20, 15, 30);

                        // Renderer
                        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true });
                        renderer.setSize(window.innerWidth, window.innerHeight);
                        renderer.setPixelRatio(window.devicePixelRatio);
                        container.appendChild(renderer.domElement);

                        // Controls
                        const controls = new THREE.OrbitControls(camera, renderer.domElement);
                        controls.enableDamping = true;
                        controls.dampingFactor = 0.05;
                        controls.enablePan = false;
                        controls.minDistance = 15;
                        controls.maxDistance = 50;

                        // Lighting
                        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
                        scene.add(ambientLight);

                        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                        directionalLight.position.set(10, 20, 15);
                        scene.add(directionalLight);

                        const fillLight = new THREE.DirectionalLight(0x90b0d0, 0.4);
                        fillLight.position.set(-10, 0, -15);
                        scene.add(fillLight);

                        // --- STREAMING_CHUNK:Creating the exaggerated Earth (Geoid) mesh... ---
                        // 1. The Lumpy Earth (Geoid representation)
                        // We create a sphere and perturb its vertices to make it look "lumpy"
                        const baseRadius = 10;
                        const segments = 64;
                        const earthGeometry = new THREE.SphereGeometry(baseRadius, segments, segments);

                        // Exaggerate lumpiness using a simple noise-like function based on vertex position
                        const positions = earthGeometry.attributes.position;
                        const originalPositions = []; // Store original for reference if needed

                        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3();
                        vertex.fromBufferAttribute(positions, i);
                        originalPositions.push(vertex.clone());

                        // Create "lumps" - mostly a mix of sine waves based on coordinates
                        // This is highly exaggerated for educational purposes!
                        const lumpiness = 0.8;
                        const noise =
                        Math.sin(vertex.x * 0.5) * Math.cos(vertex.y * 0.3) * lumpiness +
                        Math.cos(vertex.z * 0.4) * Math.sin(vertex.y * 0.6) * lumpiness * 0.5;

                        vertex.normalize().multiplyScalar(baseRadius + noise);
                        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

                        earthGeometry.computeVertexNormals(); // Recompute lighting normals

                        const earthMaterial = new THREE.MeshStandardMaterial({
                            color: 0x4ade80, // green-400
                        roughness: 0.8,
                        metalness: 0.1,
                        flatShading: true, // Gives a slightly low-poly look emphasizing the bumps
                        transparent: true,
                        opacity: 0.85
        });

                        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
                        scene.add(earthMesh);

                        // --- STREAMING_CHUNK:Creating the Mathematical Ellipsoid (Wireframe)... ---
                        // 2. The Mathematical Ellipsoid (Datum model)
                        // We'll use a wireframe sphere that we will scale/shift to represent different datums.
                        // True ellipsoids have slight flattening, but we'll exaggerate it slightly to be visible.

                        const ellipsoidGroup = new THREE.Group();
                        scene.add(ellipsoidGroup);

                        const ellipsoidGeom = new THREE.SphereGeometry(baseRadius + 0.5, 32, 32);
                        const ellipsoidMat = new THREE.MeshBasicMaterial({
                            color: 0x60a5fa, // blue-400
                        wireframe: true,
                        transparent: true,
                        opacity: 0.4
        });
                        const ellipsoidMesh = new THREE.Mesh(ellipsoidGeom, ellipsoidMat);

                        // Add equatorial and prime meridian lines for better visual reference
                        const equatorGeom = new THREE.RingGeometry(baseRadius + 0.5, baseRadius + 0.52, 64);
                        const lineMat = new THREE.MeshBasicMaterial({color: 0x93c5fd, side: THREE.DoubleSide }); // blue-300
                        const equator = new THREE.Mesh(equatorGeom, lineMat);
                        equator.rotation.x = Math.PI / 2;

                        ellipsoidGroup.add(ellipsoidMesh);
                        ellipsoidGroup.add(equator);

                        // --- STREAMING_CHUNK:Setting up the Coordinate Marker... ---
                        // 3. The Coordinate Marker
                        // This represents a specific Lat/Lon. It sits on the surface of the *Ellipsoid*.
                        // When the ellipsoid shifts (datum change), this marker moves relative to the green earth.

                        // Fixed coordinate (e.g., somewhere in North America for NAD27 dramatic effect)
                        const targetLat = 40 * (Math.PI / 180);
                        const targetLon = -100 * (Math.PI / 180);

                        // Function to convert Lat/Lon to 3D point on an ellipsoid
                        function getPointOnEllipsoid(lat, lon, radiusX, radiusY, radiusZ) {
            const x = radiusX * Math.cos(lat) * Math.cos(lon);
                        const z = radiusZ * Math.cos(lat) * Math.sin(lon); // Note: Threejs Z is forward/back
                        const y = radiusY * Math.sin(lat);
                        return new THREE.Vector3(x, y, z);
        }

                        // Marker visuals
                        const markerGroup = new THREE.Group();
                        ellipsoidGroup.add(markerGroup); // Attach to ellipsoid so it moves with it

                        // The pin head
                        const markerGeom = new THREE.SphereGeometry(0.6, 16, 16);
                        const markerMat = new THREE.MeshBasicMaterial({color: 0xef4444 }); // red-500
                        const markerMesh = new THREE.Mesh(markerGeom, markerMat);
                        markerGroup.add(markerMesh);

                        // Glow effect
                        const glowGeom = new THREE.SphereGeometry(0.8, 16, 16);
                        const glowMat = new THREE.MeshBasicMaterial({
                            color: 0xf87171,
                        transparent: true,
                        opacity: 0.5,
                        blending: THREE.AdditiveBlending 
        });
                        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
                        markerGroup.add(glowMesh);

                        // Line pointing to center
                        const lineGeom = new THREE.BufferGeometry();
                        const lineMaterial = new THREE.LineBasicMaterial({color: 0xef4444 });
                        const centerLine = new THREE.Line(lineGeom, lineMaterial);
                        markerGroup.add(centerLine);

                        // --- STREAMING_CHUNK:Defining Datum configurations and animation logic... ---
                        // 4. Datum Configurations
                        // We define how the ellipsoid shifts and scales compared to the geoid's center (0,0,0)
                        const datums = {
                            'wgs84': {
                            name: "WGS 84",
                        desc: "The mathematical center matches the Earth's center of mass. The ellipsoid surrounds the lumpy earth evenly.",
                        offset: new THREE.Vector3(0, 0, 0),
                        scale: new THREE.Vector3(1, 0.98, 1) // Slight flattening at poles
            },
                        'nad27': {
                            name: "NAD 27",
                        desc: "Shifted so the ellipsoid surface perfectly hugs the North American continent. See how it pulls away from the earth elsewhere!",
                        offset: new THREE.Vector3(-1.5, 0.8, -1.0), // Shift towards N. America (roughly top-left-back in our view)
                        scale: new THREE.Vector3(0.99, 0.97, 0.99)
            },
                        'tokyo': {
                            name: "Tokyo Datum",
                        desc: "Shifted dramatically to fit the local region of Japan. The same coordinate now points to a completely different spot relative to the real earth.",
                        offset: new THREE.Vector3(2.0, 0.5, 1.5), // Shift towards Asia
                        scale: new THREE.Vector3(1.02, 1.0, 1.02)
            }
        };

                        let currentDatum = 'wgs84';

                        // Animation variables for smooth transitions
                        let targetOffset = datums[currentDatum].offset.clone();
                        let targetScale = datums[currentDatum].scale.clone();

                        function updateMarkerPosition() {
            // Base radius of ellipsoid before scale
            const r = baseRadius + 0.5;
                        const pos = getPointOnEllipsoid(targetLat, targetLon, r, r, r);

                        markerMesh.position.copy(pos);
                        glowMesh.position.copy(pos);

                        // Update line from marker to center of the ellipsoid
                        const linePositions = new Float32Array([
                        pos.x, pos.y, pos.z,
                        0, 0, 0 // Center of ellipsoidGroup
                        ]);
                        centerLine.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        }

                        // Initial setup
                        updateMarkerPosition();
                        ellipsoidGroup.position.copy(targetOffset);
                        ellipsoidGroup.scale.copy(targetScale);

                        // --- STREAMING_CHUNK:Handling UI interactions and responsive resizing... ---
                        // 5. Interaction Logic

                        // Datum Selection
                        const radioButtons = document.querySelectorAll('input[name="datum"]');
                        const jumpText = document.getElementById('jump-distance');
        
        radioButtons.forEach(radio => {
                            radio.addEventListener('change', (e) => {
                                const selected = e.target.value;
                                if (datums[selected]) {
                                    currentDatum = selected;
                                    targetOffset = datums[selected].offset.clone();
                                    targetScale = datums[selected].scale.clone();

                                    // Update text
                                    jumpText.innerHTML = `<strong>${datums[selected].name}:</strong> ${datums[selected].desc}`;

                                    // Trigger pulse animation to draw attention
                                    glowMesh.scale.set(1.5, 1.5, 1.5);
                                    setTimeout(() => { glowMesh.scale.set(1, 1, 1); }, 300);
                                }
                            });
        });

                        // Toggle Geoid visibility
                        const toggleGeoid = document.getElementById('toggle-geoid');
        toggleGeoid.addEventListener('change', (e) => {
                            // Animate opacity instead of abrupt hide
                            earthMaterial.transparent = true;
                        earthMaterial.opacity = e.target.checked ? 0.85 : 0.1;
                        // Need to set wireframe to false if opacity is low so it doesn't look weird
                        earthMaterial.wireframe = !e.target.checked;
        });

                        // Window resize handling
                        window.addEventListener('resize', onWindowResize, false);
                        function onWindowResize() {
                            camera.aspect = window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(window.innerWidth, window.innerHeight);
        }

                        // HTML Screen Marker Tracking (Optional, for 2D UI overlay effect)
                        const screenMarker = document.getElementById('screen-marker');
                        function updateScreenMarker() {
            // Get world position of the 3D marker
            const worldPos = new THREE.Vector3();
                        markerMesh.getWorldPosition(worldPos);

                        // Project to screen space
                        worldPos.project(camera);

                        // Convert to CSS coordinates
                        const x = (worldPos.x * .5 + .5) * window.innerWidth;
                        const y = (worldPos.y * -.5 + .5) * window.innerHeight;

                        // Only show if in front of camera
                        if (worldPos.z < 1) {
                            screenMarker.style.display = 'block';
                        screenMarker.style.left = `${x}px`;
                        screenMarker.style.top = `${y}px`;
            } else {
                            screenMarker.style.display = 'none';
            }
        }

                        // --- STREAMING_CHUNK:Main animation loop... ---
                        // 6. Animation Loop
                        const clock = new THREE.Clock();

                        function animate() {
                            requestAnimationFrame(animate);

                        const delta = clock.getDelta();
                        const time = clock.getElapsedTime();

                        // Smoothly interpolate ellipsoid transform towards target datum
                        ellipsoidGroup.position.lerp(targetOffset, 0.05);
                        ellipsoidGroup.scale.lerp(targetScale, 0.05);

                        // Rotate the whole scene slowly to show it off
                        // We rotate both earth and ellipsoid group together so relative offset remains visible
                        const rotationSpeed = 0.1 * delta;
                        scene.rotation.y += rotationSpeed;

                        // Animate marker glow
                        const scale = 1 + Math.sin(time * 4) * 0.2;
                        glowMesh.scale.set(scale, scale, scale);

                        controls.update();
                        renderer.render(scene, camera);

            // Update 2D overlay marker
            // updateScreenMarker(); // Commented out to reduce clutter, rely on 3D marker
        }

                        // Start animation
                        animate();

                    </script>
                </body>
            </html>