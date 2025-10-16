// La instrucción 'import * as THREE from './three.module.js';' 
// se evita aquí ya que se importó desde el CDN en el HTML.
// Usaremos la variable global THREE.
const z_spread = 40;

let scene, camera, renderer, clock, container, controls;
const images = []; // Array para guardar las texturas/mallas de las imágenes flotantes

// --- 1. FUNCIÓN DE INICIALIZACIÓN ---
function init() {
    // 1.1. Configurar la escena
    scene = new THREE.Scene();
    // Puedes cambiar el fondo para que sea más 'latente' o 'atmosférico'
    scene.background = new THREE.Color(0x0f0f0f); 

    // 1.2. Configurar la cámara (Perspectiva)
    camera = new THREE.PerspectiveCamera(
        35, // Campo de visión (Field of View - FOV)
        window.innerWidth / window.innerHeight, // Aspect Ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    // Posición inicial de la cámara
    camera.position.z = 5;

    // 1.3. Configurar el renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 1.4. Luz (Importante para ver objetos)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Luz suave
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, .8);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 1.5. Reloj para animaciones con delta time
    clock = new THREE.Clock();

    // 1.6. Create multiple cubes with different images
    for (let i = 0; i < 7; i++) {
        const cube = createImageCube(i);
        scene.add(cube);
        images.push(cube);
    }

    // 1.7. Controles de cámara (FirstPersonControls) y límites de zoom
    window.addEventListener('resize', onWindowResize, false);

    // Calcular límites de Z entre la vista inicial y la imagen más lejana
    const initZ = camera.position.z;
    const furthestZ = images.reduce((acc, m) => m.position.z < acc ? m.position.z : acc, images[0].position.z);
    const minZ = Math.min(initZ, furthestZ);
    const maxZ = Math.max(initZ, furthestZ);

    // PointerLockControls para POV con clic derecho
    controls = new THREE.PointerLockControls(camera, renderer.domElement);
    // Bloquear menú contextual para clic derecho fluido
    renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
    // Lock al presionar clic derecho; unlock al soltar o salir del canvas
    renderer.domElement.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            controls.lock();
            e.preventDefault();
        }
    });
    renderer.domElement.addEventListener('mouseup', (e) => {
        if (controls.isLocked) controls.unlock();
    });
    renderer.domElement.addEventListener('mouseleave', () => {
        if (controls.isLocked) controls.unlock();
    });

    // Movimiento en Z con rueda, limitado entre minZ y maxZ
    window.addEventListener('wheel', (e) => {
        const sensitivity = 0.02; // rueda arriba (deltaY negativo) avanza en Z
        camera.position.z = THREE.MathUtils.clamp(
            camera.position.z + e.deltaY * sensitivity,
            minZ,
            maxZ
        );
    });

    // 1.8. Iniciar el ciclo de renderizado (loop)
    animate();
}

// Function to get random position within ellipse
function getRandomPosition() {
    const angle = Math.random() * Math.PI * 2;
    const radiusX = Math.random() * 4;
    const radiusY = Math.random() * 2;
    return {
        x: Math.cos(angle) * radiusX,
        y: Math.sin(angle) * radiusY,
        z: Math.random() * z_spread - z_spread
    };
}

// Function to create a cube with image textures
function createImageCube(imageIndex) {
    const images = ['ARDOR5 COVER DEFINITIVO.png', 'OPERADOR portada.png', 'Synchro PORTADA.png', 'cover presunto cielo1.png', 'ep_tapa.png', 'nueva portada ascuas op 24.png', 'portada finalfinalfinal.png'];
    const loader = new THREE.TextureLoader();
    const texture = loader.load(`images/${images[imageIndex % images.length]}`);
    const textureFlipped = texture.clone();
    textureFlipped.wrapS = THREE.RepeatWrapping;
    textureFlipped.repeat.x = -1;
    
    const materials = [
        new THREE.MeshStandardMaterial({color: 0x333333}), // right
        new THREE.MeshStandardMaterial({color: 0x333333}), // left
        new THREE.MeshStandardMaterial({color: 0x333333}), // top
        new THREE.MeshStandardMaterial({color: 0x333333}), // bottom
        new THREE.MeshStandardMaterial({map: texture}), // front
        new THREE.MeshStandardMaterial({map: textureFlipped}) // back
    ];
    
    const geometry = new THREE.BoxGeometry(2, 2, 0.001);
    const cube = new THREE.Mesh(geometry, materials);
    const position = getRandomPosition();
    cube.position.set(position.x, position.y, position.z);
    return cube;
}

// --- 3. CICLO DE RENDERIZADO (Loop principal) ---
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Tiempo transcurrido desde el último frame

    // Animación de los objetos (simulando flotar/nubes)
    images.forEach(img => {
        // Rotación sutil
        img.rotation.y = Math.sin(clock.elapsedTime * .005) * (Math.PI / 4); // ±45 grados
        
        // Movimiento muy lento para simular 'flotar' (opcional)
        img.position.x += Math.sin(clock.elapsedTime * 0.1) * 0.001; 
    });
    // FirstPersonControls requiere delta
    if (controls && typeof controls.update === 'function') {
        controls.update(delta);
    }
    renderer.render(scene, camera);
}

// --- 4. MANEJO DE VENTANA ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- INICIAR EL SITIO ---
init();

// ----------------------------------------------------------------------
// PRÓXIMOS PASOS:
// 1. Crear una función para cargar y mostrar una imagen real (textura).
// 2. Implementar la distribución aleatoria en un volumen más grande.
// 3. Aplicar los efectos de profundidad (opacidad/blur).
// 4. Implementar el control de cámara (ej. OrbitControls de Three.js).