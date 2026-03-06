// Botão de instalação
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('App instalado');
    }
    
    deferredPrompt = null;
    installBtn.style.display = 'none';
});

// Detectar se está instalado
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App rodando standalone');
    document.body.classList.add('installed');
}