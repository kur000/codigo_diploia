// La instrucción 'import * as THREE from './three.module.js';' 
// se evita aquí ya que se importó desde el CDN en el HTML.
// Usaremos la variable global THREE.
const z_spread = 40;

let scene, camera, renderer, clock, container, controls;
const images = []; // Array para guardar las texturas/mallas de las imágenes flotantes
let initZ = 0; // Z inicial de la cámara para clamp dinámico

// --- 1. FUNCIÓN DE INICIALIZACIÓN ---
// --> CAMBIO 1: La función init ahora es 'async' para poder usar 'await'.
async function init() {
    // 1.1. Configurar la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f0f);

    // 1.2. Configurar la cámara (Perspectiva)
    camera = new THREE.PerspectiveCamera(
        35, // Campo de visión (Field of View - FOV)
        window.innerWidth / window.innerHeight, // Aspect Ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    camera.position.z = 5;

    // 1.3. Configurar el renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 1.4. Luz (Importante para ver objetos)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, .8);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 1.5. Reloj para animaciones con delta time
    clock = new THREE.Clock();

    // --> CAMBIO 2: Se elimina el bucle que creaba 7 cubos de prueba.
    // Ya no es necesario porque cargaremos las imágenes reales desde la base de datos.

    // --> CAMBIO 3: Llamamos a la función para cargar las imágenes guardadas.
    await loadPersistentImages();

    // 1.7. Controles de cámara y límites de zoom
    window.addEventListener('resize', onWindowResize, false);

    // Calcular límites de Z entre la vista inicial y la imagen más lejana
    const furthestZ = getFurthestZ();
    const minZ = Math.min(initZ, furthestZ);
    const maxZ = Math.max(initZ, furthestZ);

    // PointerLockControls para POV con clic derecho
    controls = new THREE.PointerLockControls(camera, renderer.domElement);
    renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
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
        const sensitivity = 0.02;
        camera.position.z = THREE.MathUtils.clamp(
            camera.position.z + e.deltaY * sensitivity,
            minZ,
            maxZ
        );
    });

    // Listeners para Drag and Drop
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    window.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (controls && controls.isLocked) controls.unlock();
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file || !file.type || !file.type.startsWith('image/')) return;

        const previewUrl = URL.createObjectURL(file);
        const cube = addImageCubeFromUrl(previewUrl, true); // Añadido flag para posicionar diferente

        try {
            const fd = new FormData();
            fd.append('image', file);
            const resp = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await resp.json();

            if (data && data.imageUrl) {
                const loader = new THREE.TextureLoader();
                loader.crossOrigin = 'anonymous';
                const newTex = loader.load(data.imageUrl);
                const newTexFlipped = newTex.clone();
                newTexFlipped.wrapS = THREE.RepeatWrapping;
                newTexFlipped.repeat.x = -1;

                cube.material[4].map = newTex;
                cube.material[5].map = newTexFlipped;
                cube.material[4].map.needsUpdate = true;
                cube.material[5].map.needsUpdate = true;
            }
        } catch (err) {
            console.warn('Upload failed, kept local preview:', err);
        }
    });

    // Wheel Z movement con límites dinámicos
    window.addEventListener('wheel', (e) => {
        const sensitivity = 0.02;
        const furthestZ = getFurthestZ();
        const minZ = Math.min(initZ, furthestZ);
        const maxZ = Math.max(initZ, furthestZ);
        camera.position.z = THREE.MathUtils.clamp(
            camera.position.z + e.deltaY * sensitivity,
            minZ,
            maxZ
        );
    });

    // 1.8. Iniciar el ciclo de renderizado (loop)
    animate();
}

// --> CAMBIO 4: Nueva función para cargar las imágenes desde el servidor.
async function loadPersistentImages() {
    try {
        const response = await fetch('/api/images');
        if (!response.ok) {
            throw new Error('No se pudieron cargar las imágenes del servidor.');
        }
        const savedImages = await response.json();

        // Crea un cubo en la escena por cada imagen guardada
        savedImages.forEach(image => {
            addImageCubeFromUrl(image.url, false); // El flag 'false' usa la posición aleatoria
        });

    } catch (error) {
        console.error("Error al cargar imágenes persistentes:", error);
    }
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

// --- 3. CICLO DE RENDERIZADO (Loop principal) ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    images.forEach(img => {
        img.rotation.y = Math.sin(clock.elapsedTime * .005) * (Math.PI / 4);
        img.position.x += Math.sin(clock.elapsedTime * 0.1) * 0.001;
    });
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

function getFurthestZ() {
    if (images.length === 0) return initZ;
    return images.reduce((acc, m) => m.position.z < acc ? m.position.z : acc, images[0].position.z);
}

function addImageCubeFromUrl(url, placeInFrontOfCamera = false) {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    const texture = loader.load(url);
    const textureFlipped = texture.clone();
    textureFlipped.wrapS = THREE.RepeatWrapping;
    textureFlipped.repeat.x = -1;

    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ map: texture }),
        new THREE.MeshStandardMaterial({ map: textureFlipped })
    ];

    const geometry = new THREE.BoxGeometry(2, 2, 0.001);
    const cube = new THREE.Mesh(geometry, materials);

    if (placeInFrontOfCamera) {
        // Coloca la nueva imagen subida justo delante de la cámara
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const distance = 4;
        const pos = camera.position.clone().add(forward.multiplyScalar(distance));
        cube.position.copy(pos);
    } else {
        // Coloca las imágenes cargadas al inicio en posiciones aleatorias
        const position = getRandomPosition();
        cube.position.set(position.x, position.y, position.z);
    }

    scene.add(cube);
    images.push(cube);
    return cube;
}