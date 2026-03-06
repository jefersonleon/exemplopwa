// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.log('Falha ao registrar ServiceWorker:', error);
            });
    });
}

// Gerenciar menu hamburger
document.querySelector('.hamburger').addEventListener('click', () => {
    document.querySelector('.nav-menu').classList.toggle('active');
});

// Gerenciar status online/offline
function updateOnlineStatus() {
    const statusBar = document.getElementById('statusBar');
    if (navigator.onLine) {
        statusBar.textContent = 'Você está online';
        statusBar.classList.add('online');
        setTimeout(() => {
            statusBar.style.display = 'none';
        }, 3000);
    } else {
        statusBar.textContent = 'Você está offline - Modo de visualização';
        statusBar.classList.remove('online');
        statusBar.style.display = 'block';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Verificar status inicial
if (!navigator.onLine) {
    updateOnlineStatus();
}

// Botão de instalação PWA
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
    deferredPrompt = null;
    installBtn.style.display = 'none';
});

// Smooth scroll para links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            // Fechar menu mobile
            document.querySelector('.nav-menu').classList.remove('active');
        }
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App rodando em modo standalone');
    }
});

// Cache para uso offline (simples)
const cacheData = async () => {
    if ('caches' in window) {
        const cache = await caches.open('cafe-pwa-v1');
        cache.addAll([
            '/',
            '/index.html',
            '/css/style.css',
            '/js/script.js',
            '/manifest.json'
        ]);
    }
};

// Tentar cache quando online
if (navigator.onLine) {
    cacheData();
}
// Diagnóstico Completo
console.log('=== DIAGNÓSTICO PWA COMPLETO ===');

// 1. Verificar arquivos físicos
async function checkFiles() {
    const files = [
        '/index.html',
        '/css/style.css',
        '/js/script.js',
        '/manifest.json',
        '/sw.js',
        '/icons/icon-72x72.png',
        '/icons/icon-144x144.png',
        '/icons/icon-192x192.png'
    ];

    for (const file of files) {
        try {
            const response = await fetch(file, { method: 'HEAD' });
            console.log(`${response.ok ? '✅' : '❌'} ${file} - ${response.status}`);
        } catch (e) {
            console.log(`❌ ${file} - Erro: ${e.message}`);
        }
    }
}

// 2. Verificar Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
            console.log('✅ Service Workers registrados:', registrations.length);
            registrations.forEach((reg, i) => {
                console.log(`  ${i + 1}. Scope: ${reg.scope}`);
                console.log(`     Ativo: ${!!reg.active}`);
                console.log(`     Instalando: ${!!reg.installing}`);
                console.log(`     Esperando: ${!!reg.waiting}`);
            });
        } else {
            console.log('❌ Nenhum Service Worker registrado');
        }
    });
}

// 3. Verificar Cache
caches.keys().then(keys => {
    console.log('📦 Caches encontrados:', keys.length ? keys.join(', ') : 'Nenhum');
    keys.forEach(key => {
        caches.open(key).then(cache => {
            cache.keys().then(requests => {
                console.log(`  ${key}: ${requests.length} arquivos em cache`);
            });
        });
    });
});

// 4. Teste de Instalação
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ Evento beforeinstallprompt disparado! O PWA pode ser instalado');
    // Previne que o prompt automático apareça
    e.preventDefault();
    // Aqui você pode mostrar seu botão personalizado
    deferredPrompt = e;
});

// 5. Verificar modo atual
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ App rodando em modo standalone (instalado)');
} else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    console.log('✅ App rodando em minimal-ui');
} else {
    console.log('ℹ️ App rodando no navegador');
}

checkFiles();
console.log('=== FIM DIAGNÓSTICO ===');