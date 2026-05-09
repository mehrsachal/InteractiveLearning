import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Globe } from 'lucide-react';

export default function DatumsAndEllipsoids() {
    const mountRef = useRef(null);
    const [currentDatum, setCurrentDatum] = useState('wgs84');
    const [showGeoid, setShowGeoid] = useState(true);

    const datums = {
        'wgs84': {
            name: "WGS 84",
            desc: "The mathematical center matches the Earth's center of mass. The ellipsoid surrounds the lumpy earth evenly.",
            offset: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 0.98, 1)
        },
        'nad27': {
            name: "NAD 27",
            desc: "Shifted so the ellipsoid surface perfectly hugs the North American continent. See how it pulls away from the earth elsewhere!",
            offset: new THREE.Vector3(-1.5, 0.8, -1.0),
            scale: new THREE.Vector3(0.99, 0.97, 0.99)
        },
        'tokyo': {
            name: "Tokyo Datum",
            desc: "Shifted dramatically to fit the local region of Japan. The same coordinate now points to a completely different spot relative to the real earth.",
            offset: new THREE.Vector3(2.0, 0.5, 1.5),
            scale: new THREE.Vector3(1.02, 1.0, 1.02)
        }
    };

    useEffect(() => {
        if (!mountRef.current) return;

        const container = mountRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(20, 15, 30);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.minDistance = 15;
        controls.maxDistance = 50;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 15);
        scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0x90b0d0, 0.4);
        fillLight.position.set(-10, 0, -15);
        scene.add(fillLight);

        const baseRadius = 10;
        const segments = 64;
        const earthGeometry = new THREE.SphereGeometry(baseRadius, segments, segments);
        const positions = earthGeometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positions, i);
            const lumpiness = 0.8;
            const noise = Math.sin(vertex.x * 0.5) * Math.cos(vertex.y * 0.3) * lumpiness +
                          Math.cos(vertex.z * 0.4) * Math.sin(vertex.y * 0.6) * lumpiness * 0.5;
            vertex.normalize().multiplyScalar(baseRadius + noise);
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        earthGeometry.computeVertexNormals();

        const earthMaterial = new THREE.MeshStandardMaterial({
            color: 0x4ade80,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true,
            transparent: true,
            opacity: 0.85,
            wireframe: false
        });
        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earthMesh);

        const ellipsoidGroup = new THREE.Group();
        scene.add(ellipsoidGroup);

        const ellipsoidGeom = new THREE.SphereGeometry(baseRadius + 0.5, 32, 32);
        const ellipsoidMat = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const ellipsoidMesh = new THREE.Mesh(ellipsoidGeom, ellipsoidMat);

        const equatorGeom = new THREE.RingGeometry(baseRadius + 0.5, baseRadius + 0.52, 64);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, side: THREE.DoubleSide });
        const equator = new THREE.Mesh(equatorGeom, lineMat);
        equator.rotation.x = Math.PI / 2;

        ellipsoidGroup.add(ellipsoidMesh);
        ellipsoidGroup.add(equator);

        const targetLat = 40 * (Math.PI / 180);
        const targetLon = -100 * (Math.PI / 180);

        function getPointOnEllipsoid(lat, lon, radiusX, radiusY, radiusZ) {
            const x = radiusX * Math.cos(lat) * Math.cos(lon);
            const z = radiusZ * Math.cos(lat) * Math.sin(lon);
            const y = radiusY * Math.sin(lat);
            return new THREE.Vector3(x, y, z);
        }

        const markerGroup = new THREE.Group();
        ellipsoidGroup.add(markerGroup);

        const markerGeom = new THREE.SphereGeometry(0.6, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const markerMesh = new THREE.Mesh(markerGeom, markerMat);
        markerGroup.add(markerMesh);

        const glowGeom = new THREE.SphereGeometry(0.8, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xf87171,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending 
        });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        markerGroup.add(glowMesh);

        const lineGeom = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xef4444 });
        const centerLine = new THREE.Line(lineGeom, lineMaterial);
        markerGroup.add(centerLine);

        let targetOffset = datums['wgs84'].offset.clone();
        let targetScale = datums['wgs84'].scale.clone();

        function updateMarkerPosition() {
            const r = baseRadius + 0.5;
            const pos = getPointOnEllipsoid(targetLat, targetLon, r, r, r);
            markerMesh.position.copy(pos);
            glowMesh.position.copy(pos);
            const linePositions = new Float32Array([
                pos.x, pos.y, pos.z,
                0, 0, 0
            ]);
            centerLine.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        }

        updateMarkerPosition();
        ellipsoidGroup.position.copy(targetOffset);
        ellipsoidGroup.scale.copy(targetScale);

        const clock = new THREE.Clock();
        let animationFrameId;

        // Save references for external updates
        container.userData = {
            setDatum: (datumKey) => {
                const d = datums[datumKey];
                if (d) {
                    targetOffset = d.offset.clone();
                    targetScale = d.scale.clone();
                    glowMesh.scale.set(1.5, 1.5, 1.5);
                    setTimeout(() => { if (glowMesh) glowMesh.scale.set(1, 1, 1); }, 300);
                }
            },
            setGeoidVisible: (visible) => {
                earthMaterial.opacity = visible ? 0.85 : 0.1;
                earthMaterial.wireframe = !visible;
            }
        };

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            ellipsoidGroup.position.lerp(targetOffset, 0.05);
            ellipsoidGroup.scale.lerp(targetScale, 0.05);

            scene.rotation.y += 0.1 * delta;

            const scale = 1 + Math.sin(time * 4) * 0.2;
            glowMesh.scale.set(scale, scale, scale);

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        const handleResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []); // Empty dependency array, initialize once

    // Effect for handling React state changes
    useEffect(() => {
        if (mountRef.current && mountRef.current.userData) {
            mountRef.current.userData.setDatum(currentDatum);
        }
    }, [currentDatum]);

    useEffect(() => {
        if (mountRef.current && mountRef.current.userData) {
            mountRef.current.userData.setGeoidVisible(showGeoid);
        }
    }, [showGeoid]);

    return (
        <div className="relative w-full h-full min-h-[800px] bg-slate-900 overflow-hidden rounded-xl">
            <div ref={mountRef} className="absolute inset-0 z-0" />
            
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
                <header className="flex flex-col md:flex-row justify-between items-start w-full max-w-7xl mx-auto gap-4">
                    <div className="pointer-events-auto bg-slate-800/85 backdrop-blur-md border border-slate-400/20 p-5 rounded-2xl shadow-xl max-w-md w-full">
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">ELI5: Datums & Ellipsoids</h1>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            The Earth isn't perfectly round; it's lumpy like a potato. To make maps, we use smooth mathematical shapes called <strong>Ellipsoids</strong> to approximate it. A <strong>Datum</strong> connects this shape to the real earth.
                        </p>
                    </div>

                    <div className="pointer-events-auto bg-slate-800/85 backdrop-blur-md border border-slate-400/20 p-5 rounded-2xl shadow-xl w-full md:w-80 shrink-0">
                        <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-600 pb-2">Select a Datum</h2>
                        
                        <div className="space-y-3">
                            {Object.entries(datums).map(([key, datum]) => (
                                <label key={key} className="flex items-center cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="datum" 
                                        value={key}
                                        checked={currentDatum === key}
                                        onChange={(e) => setCurrentDatum(e.target.value)}
                                        className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-600 focus:ring-2 accent-blue-500" 
                                    />
                                    <span className="ml-3 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                        {datum.name}
                                        <span className="block text-xs text-slate-400 mt-0.5">{key === 'wgs84' ? 'Best fit for the whole earth. Used by GPS.' : key === 'nad27' ? 'Fits North America perfectly, but terribly elsewhere.' : 'Shifted to fit the Japanese islands closely.'}</span>
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-600">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-300">Show Lumpy Earth (Geoid)</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={showGeoid}
                                        onChange={(e) => setShowGeoid(e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row justify-between items-end w-full max-w-7xl mx-auto mt-auto gap-4">
                    <div className="pointer-events-auto bg-slate-800/85 backdrop-blur-md border border-slate-400/20 p-4 rounded-2xl shadow-xl text-sm flex gap-6 w-full lg:w-auto overflow-x-auto whitespace-nowrap">
                        <div className="flex items-center text-slate-300 shrink-0">
                            <span className="w-3 h-3 rounded-full bg-green-400 inline-block mr-2"></span> True Shape
                        </div>
                        <div className="flex items-center text-slate-300 shrink-0">
                            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block mr-2"></span> Math Ellipsoid
                        </div>
                        <div className="flex items-center text-slate-300 shrink-0">
                            <span className="w-3 h-3 rounded-full bg-red-400 inline-block mr-2 shadow-[0_0_8px_rgba(248,113,113,0.8)]"></span> Coordinate Point
                        </div>
                    </div>

                    <div className="pointer-events-auto bg-slate-800/85 backdrop-blur-md border border-slate-400/20 p-5 rounded-2xl shadow-xl max-w-sm ml-auto w-full">
                        <h3 className="text-white font-semibold mb-2">The "Jump" Effect</h3>
                        <div className="text-sm text-slate-300 space-y-2 overflow-y-auto max-h-32 pr-2 custom-scrollbar">
                            <p>Notice the red marker? It represents a fixed GPS coordinate (e.g., Lat: 40°, Lon: -100°).</p>
                            <p>Because different datums shift the mathematical sphere (blue grid) relative to the earth, the physical location of that coordinate "jumps" when you switch datums!</p>
                            <p className="text-blue-400 font-medium mt-2">
                                <strong>{datums[currentDatum].name}:</strong> {datums[currentDatum].desc}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.8); border-radius: 4px; }
            `}} />
        </div>
    );
}

export const metadata = {
  id: 'ellipsoids-datums',
  title: 'ELI5: Ellipsoids & Datum Shifts',
  description: 'An interactive visualization explaining the difference between the true shape of the Earth (Geoid), mathematical ellipsoids, and how changing datums causes coordinates to shift.',
  iconName: 'Globe',
  category: 'GIS Math',
  status: 'Available'
};