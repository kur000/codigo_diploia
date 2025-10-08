// La instrucción 'import * as THREE from './three.module.js';' 
// se evita aquí ya que se importó desde el CDN en el HTML.
// Usaremos la variable global THREE.

let scene, camera, renderer, clock, container;
const images = []; // Array para guardar las texturas/mallas de las imágenes flotantes

// --- 1. FUNCIÓN DE INICIALIZACIÓN ---
function init() {
    // 1.1. Configurar la escena
    scene = new THREE.Scene();
    // Puedes cambiar el fondo para que sea más 'latente' o 'atmosférico'
    scene.background = new THREE.Color(0x0a0a0a); 

    // 1.2. Configurar la cámara (Perspectiva)
    camera = new THREE.PerspectiveCamera(
        75, // Campo de visión (Field of View - FOV)
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
    const ambientLight = new THREE.AmbientLight(0x404040); // Luz suave
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 1.5. Reloj para animaciones con delta time
    clock = new THREE.Clock();

    // 1.6. Ejemplo: Añadir un cubo de prueba
    addTestCube();
    addTestCube();
    addTestCube();

    // 1.7. Manejar el redimensionamiento de la ventana
    window.addEventListener('resize', onWindowResize, false);
    
    // 1.8. Iniciar el ciclo de renderizado (loop)
    animate();
}

// --- 2. CÓDIGO DE PRUEBA ---
function addTestCube() {
    // Geometría y material del cubo
    const geometry = new THREE.BoxGeometry(1, 1, 0.01);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);

    // Posición aleatoria
    cube.position.set(
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2
    );
    
    scene.add(cube);
    images.push(cube); // Lo añadimos al array de imágenes (por ahora, cubos)
}

// --- 3. CICLO DE RENDERIZADO (Loop principal) ---
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Tiempo transcurrido desde el último frame

    // Animación de los objetos (simulando flotar/nubes)
    images.forEach(img => {
        // Rotación sutil
        // img.rotation.x += Math.cos(0.1) * delta/10;
        img.rotation.y += Math.sin(0.15) * delta/100;
        
        // Movimiento muy lento para simular 'flotar' (opcional)
        img.position.x += Math.sin(clock.elapsedTime * 0.1) * 0.001; 
    });

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